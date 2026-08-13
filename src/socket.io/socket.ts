import {
    Server as SocketIOServer,
    type Socket as SocketIOClient,
} from "socket.io";

import type { Server as HTTPServer } from "node:http";

type SocketConnectHandler = (
    socket: SocketIOClient
) => void;

type SocketDisconnectHandler = (
    socket: SocketIOClient,
    reason: string
) => void;

type SocketEventHandler = (
    socket: SocketIOClient,
    ...args: unknown[]
) => void;

class QuikSocketIO {
    private readonly io: SocketIOServer;

    private connectHandler?: SocketConnectHandler;
    private disconnectHandler?: SocketDisconnectHandler;

    private readonly events = new Map<
        string,
        SocketEventHandler
    >();

    private started = false;

    constructor() {
        this.io = new SocketIOServer();
    }

    onConnect(handler: SocketConnectHandler) {
        this.connectHandler = handler;

        return this;
    }

    onDisconnect(handler: SocketDisconnectHandler) {
        this.disconnectHandler = handler;

        return this;
    }

    addEvent(
        keyword: string,
        handler: SocketEventHandler
    ) {
        this.events.set(keyword, handler);

        return this;
    }

    removeEvent(keyword: string) {
        this.events.delete(keyword);

        return this;
    }

    hasEvent(keyword: string): boolean {
        return this.events.has(keyword);
    }

    emit(
        keyword: string,
        ...args: unknown[]
    ) {
        this.io.emit(keyword, ...args);

        return this;
    }

    emitTo(
        socket: SocketIOClient,
        keyword: string,
        ...args: unknown[]
    ) {
        socket.emit(keyword, ...args);

        return this;
    }

    broadcast(
        socket: SocketIOClient,
        keyword: string,
        ...args: unknown[]
    ) {
        socket.broadcast.emit(keyword, ...args);

        return this;
    }

    getIO(): SocketIOServer {
        return this.io;
    }

    start(server: HTTPServer) {
        if (this.started) {
            return this;
        }

        this.io.attach(server);

        this.io.on("connection", (socket) => {
            this.connectHandler?.(socket);

            for (const [keyword, handler] of this.events) {
                socket.on(keyword, (...args) => {
                    handler(socket, ...args);
                });
            }

            socket.on("disconnect", (reason) => {
                this.disconnectHandler?.(
                    socket,
                    reason
                );
            });
        });

        this.started = true;

        return this;
    }

    close() {
        if (!this.started) {
            return this;
        }

        this.io.close();
        this.started = false;

        return this;
    }
}

function Socket() {
    return new QuikSocketIO();
}

export {
    Socket,
    QuikSocketIO,
};