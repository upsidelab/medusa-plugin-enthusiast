import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import EnthusiastService from "../../../../../../modules/enthusiast/service";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast";

const WS_CLOSE_UNAUTHENTICATED = 4401;
const WS_CLOSE_FORBIDDEN = 4403;

const describeClose = (code: number, reason: string) => {
  if (code === WS_CLOSE_UNAUTHENTICATED) return "Enthusiast rejected the WebSocket ticket.";
  if (code === WS_CLOSE_FORBIDDEN) return "Enthusiast denied access to this conversation.";
  return reason || `WebSocket closed with code ${code}.`;
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE);
  const { id } = req.params;
  const wsHandler = enthusiastService.buildWebsocketHandler();

  if (!wsHandler) {
    res.status(204).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const onMessage = (msg: { type: string; payload: unknown }) => {
    res.write(`event: ${msg.type}\ndata: ${JSON.stringify(msg.payload)}\n\n`);
  };

  const onError = (err: unknown) => {
    const output = err instanceof Error ? err.message : String(err);
    res.write(`event: error\ndata: ${JSON.stringify({ output })}\n\n`);
  };

  const onClose = ({ code, reason }: { code: number; reason: string }) => {
    onError(new Error(describeClose(code, reason)));
    res.end();
  };

  wsHandler.on("message", onMessage);
  wsHandler.on("error", onError);
  wsHandler.on("close", onClose);

  const keepalive = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(keepalive);
    wsHandler.off("message", onMessage);
    wsHandler.off("error", onError);
    wsHandler.off("close", onClose);
    wsHandler.close();
    res.end();
  });

  await wsHandler.createWsConnection(parseInt(id, 10));
};
