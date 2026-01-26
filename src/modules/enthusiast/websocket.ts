import { EventEmitter } from "events";
import WebSocket from "ws";

export class WebsocketHandler extends EventEmitter {
  private ws?: WebSocket;
  private wsBaseUrl_: string;

  constructor(wsBaseUrl: string) {
    super();
    this.wsBaseUrl_ = wsBaseUrl;
  }

  private handleWebSocketMessage = (data: WebSocket.RawData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const parsed = JSON.parse(data.toString()) as { event?: string; data?: unknown };
      this.emit("message", {
        type: parsed.event || "",
        payload: parsed.data,
      });
    } catch (err) {
      this.emit("error", err);
    }
  };

  private handleWebSocketError = (err: Error) => {
    this.emit("error", err);
  };

  private handleWebSocketClose = (code: number, reason: Buffer) => {
    const clean = code === 1000;
    if (!clean) {
      this.emit("close", { code, reason: reason.toString() });
    }
  };

  createWsConnection(conversationId: number) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws?.close();

    this.ws = new WebSocket(`${this.wsBaseUrl_}/ws/chat/${conversationId}/`);

    this.ws.on("message", this.handleWebSocketMessage);
    this.ws.on("error", this.handleWebSocketError);
    this.ws.on("close", this.handleWebSocketClose);
  }
}
