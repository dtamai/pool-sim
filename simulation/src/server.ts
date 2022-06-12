import express from "express";
import http from "http";
import { Server as SocketIO, Socket } from "socket.io";

export class App {
  private httpServer: http.Server;
  private socketIO: SocketIO;

  constructor(
    onConnect: (socket: Socket) => Promise<{
      handleEvent: (name: string, ...payload: any[]) => void;
      stop: () => void;
    }>
  ) {
    const app = express();

    this.httpServer = http.createServer(app);
    this.socketIO = new SocketIO(this.httpServer);

    this.socketIO.on("connection", async (socket) => {
      const { handleEvent, stop } = await onConnect(socket);

      socket.onAny((event, payload) => {
        handleEvent(event, payload);
      });
      socket.on("disconnect", stop);
    });
  }

  public start(): void {
    this.httpServer.listen(4000, () => {
      console.log("listening on *:4000");
    });
  }

  public publish(channel: string, event: any): void {
    this.socketIO.emit(channel, event);
  }
}
