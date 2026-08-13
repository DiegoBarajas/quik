import {
    WebSocketServer,
    WebSocket as WS,
    type RawData,
} from "ws";

import type { Server as HTTPServer } from "node:http";

type WebSocketClient = WS;

type ConnectHandler = (
    client: WebSocketClient
) => void;

type MessageHandler = (
    client: WebSocketClient,
    message: RawData
) => void;

type DisconnectHandler = (
    client: WebSocketClient
) => void;

type ErrorHandler = (
    client: WebSocketClient,
    error: Error
) => void;

class QuikWebSocket {
    private server?: WebSocketServer;

    private connectHandler?: ConnectHandler;
    private messageHandler?: MessageHandler;
    private disconnectHandler?: DisconnectHandler;
    private errorHandler?: ErrorHandler;

    onConnect(handler: ConnectHandler) {
        this.connectHandler = handler;

        return this;
    }

    onMessage(handler: MessageHandler) {
        this.messageHandler = handler;

        return this;
    }

    onDisconnect(handler: DisconnectHandler) {
        this.disconnectHandler = handler;

        return this;
    }

    onError(handler: ErrorHandler) {
        this.errorHandler = handler;

        return this;
    }

    send(client: WebSocketClient,
        message: string | Buffer
    ) {
        if (client.readyState === WS.OPEN) {
            client.send(message);
        }

        return this;
    }

    broadcast(message: string | Buffer) {
        if (!this.server) {
            throw new Error(
                "WebSocket server has not been started."
            );
        }

        for (const client of this.server.clients) {
            if (client.readyState === WS.OPEN) {
                client.send(message);
            }
        }

        return this;
    }

    start(server: HTTPServer) {
        if (this.server) {
            return this;
        }

        this.server = new WebSocketServer({
            server,
        });

        this.server.on("connection", (client) => {
            this.connectHandler?.(client);

            client.on("message", (message) => {
                this.messageHandler?.(
                    client,
                    message
                );
            });

            client.on("close", () => {
                this.disconnectHandler?.(client);
            });

            client.on("error", (error) => {
                this.errorHandler?.(
                    client,
                    error
                );
            });
        });

        return this;
    }

    close() {
        this.server?.close();

        return this;
    }
}

function WebSocket() {
    return new QuikWebSocket();
}

export {
    WebSocket,
    QuikWebSocket,
};

export type {
    WebSocketClient,
    ConnectHandler,
    MessageHandler,
    DisconnectHandler,
    ErrorHandler,
};