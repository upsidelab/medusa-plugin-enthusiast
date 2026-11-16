import { EventEmitter } from "events";
import WebSocket from "ws";

export type WebsocketHandlerOptions = {
  wsBaseUrl: string;
  /** Issues a single-use ticket that authenticates the WebSocket handshake. */
  ticketProvider: () => Promise<string>;
  /** Sent as the `Origin` header, which the server checks against its allowed origins. */
  origin?: string;
};

export class WebsocketHandler extends EventEmitter {
  private ws?: WebSocket;
  private wsBaseUrl_: string;
  private ticketProvider_: () => Promise<string>;
  private origin_?: string;

  constructor({ wsBaseUrl, ticketProvider, origin }: WebsocketHandlerOptions) {
    super();
    this.wsBaseUrl_ = wsBaseUrl;
    this.ticketProvider_ = ticketProvider;
    this.origin_ = origin;
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

  async createWsConnection(conversationId: number) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws?.close();

    let ticket: string;
    try {
      ticket = await this.ticketProvider_();
    } catch (err) {
      this.emit("error", err);
      return;
    }

    const url = `${this.wsBaseUrl_}/ws/chat/${conversationId}/?ticket=${encodeURIComponent(ticket)}`;
    this.ws = new WebSocket(url, this.origin_ ? { headers: { Origin: this.origin_ } } : undefined);

    this.ws.on("message", this.handleWebSocketMessage);
    this.ws.on("error", this.handleWebSocketError);
    this.ws.on("close", this.handleWebSocketClose);
  }

  close() {
    this.ws?.close();
    this.ws = undefined;
  }
}
