class ServerInvalidRouteError extends Error {
    constructor(path: string) {
        super(`"${path}" is not a QuikRouter instance.`);
    }
}

class ServerInvalidCronError extends Error {
    constructor() {
        super(`Invalid object, must be a QuikCron instance.`);
    }
}

class ServerInvalidWebSocketError extends Error {
    constructor() {
        super(`Invalid object, must be a QuikWebSocket instance.`);
    }
}

class ServerInvalidSocketIOError extends Error {
    constructor() {
        super(`Invalid object, must be a QuikSocketIO instance.`);
    }
}

export { ServerInvalidRouteError, ServerInvalidCronError, ServerInvalidWebSocketError, ServerInvalidSocketIOError }