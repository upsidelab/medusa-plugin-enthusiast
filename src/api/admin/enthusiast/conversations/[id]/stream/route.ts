import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import EnthusiastService from "../../../../../../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../../../../../../modules/enthusiast";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const { id } = req.params;
  const wsHandler = enthusiastService.buildWebsocketHandler()

  if (!wsHandler) {
    res.status(204).end()
    return
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })
  wsHandler.createWsConnection(parseInt(id, 10))


  const onMessage = (msg: any) => {
    res.write(
      `event: ${msg.type}\ndata: ${JSON.stringify(msg.payload)}\n\n`
    )
  }

  const onError = (err: any) => {
    res.write(`event: error\ndata: ${JSON.stringify(err)}\n\n`)
  }

  wsHandler.on("message", onMessage)
  wsHandler.on("error", onError)

  const keepalive = setInterval(() => {
    res.write(`: keep-alive`)
  }, 15000)

  req.on("close", () => {
    clearInterval(keepalive)
    wsHandler.off("message", onMessage)
    wsHandler.off("error", onError)
    res.end()
  })
}