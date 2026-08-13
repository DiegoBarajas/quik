import { Server, type Socket as SocketIo } from "socket.io";

type SocketHandler = (socket: SocketIo) => void;
type EmptySocketHandler = () => void;
type SocketEventHandler = (socket: SocketIo, ...args: any[]) => void;

class QuikSocket {
    io: Server;

    private onConnectHandler?: SocketHandler;
    private onDisconnectHandler?: SocketHandler;

    private events = new Map<string, SocketEventHandler>();

    constructor() {
        this.io = new Server();
    }

    onConnect(handler?: SocketHandler) {
        if (handler){
            this.onConnectHandler = handler;
        }

        return this;
    }

    onDisconnect(handler?: SocketHandler) {
        if (handler){
            this.onDisconnectHandler = handler;
        }

        return this;
    }

    addEvent(keyword: string, handler: SocketEventHandler) {
        this.events.set(keyword, handler);

        return this;
    }

    start() {
        this.io.on("connection", (socket) => {
            // On connect
            this.onConnectHandler?.(socket);

            // Events
            for (const [keyword, handler] of this.events) {
                socket.on(keyword, (...args) => handler(socket, ...args));
            }

            // On disconnect
            socket.on("disconnect", () => {
                this.onDisconnectHandler?.(socket);
            });

        });

        return this;
    }
}

function Socket() {
    return new QuikSocket();
}

export {
    Socket,
    QuikSocket
};