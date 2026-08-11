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

export { ServerInvalidRouteError, ServerInvalidCronError }