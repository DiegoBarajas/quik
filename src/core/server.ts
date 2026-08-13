import express, { type ErrorRequestHandler, type Express, type RequestHandler } from "express";
import http, { type Server as HTTPServer } from "node:http";
import path from "node:path";
import fs from "node:fs";

import { QuikRouter } from "./router.js";
import { logger } from "./logger.js";
import { translate } from "./translator.js";
import { isValidTimeZone } from "./time.js";
import { QuikCron } from "../cron/cron.js";


import { ServerInvalidCronError, ServerInvalidRouteError, ServerInvalidSocketIOError, ServerInvalidWebSocketError } from "./errors/serverErrors.js";
import { QuikNotFoundHandler } from "./handlers/notFoundHandler.js";
import { QuikErrorHandler } from "./handlers/httpErrorHandler.js";
import type { QuikSocketIO } from "../socket.io/socket.js";
import type { QuikWebSocket } from "../ws/websockets.js";

type JsonOptions = Parameters<typeof express.json>[0];
type UrlencodedOptions = Parameters<typeof express.urlencoded>[0];
type RawOptions = Parameters<typeof express.raw>[0];
type TextOptions = Parameters<typeof express.text>[0];
type BodyParserConfig =
    | {
        type: "json";
        options?: JsonOptions;
    }
    | {
        type: "urlencoded";
        options?: UrlencodedOptions;
    }
    | {
        type: "raw";
        options?: RawOptions;
    }
    | {
        type: "text";
        options?: TextOptions;
    };
type HTTPConfig = {
    port: number;
    host?: string;

    keepAlive?: number;
    timeout?: number;
    maxConnections?: number;
    shutdownTimeout?: number;
};

type ExpressConfig = {
    name?: string;
    env?: string;
    trustProxy?: boolean;
    viewEngine?: string;
};
type QuikServerConfig = {
    language: Language,
    timeZone?: string;
    bodyParser: BodyParserConfig;
    http: HTTPConfig;
    express: ExpressConfig;
};
type RoutingDict = Record<string, QuikRouter>;

const defaultConfig: QuikServerConfig = {
    language: "en",
    bodyParser: {
        type: "json"
    },

    http: {
        port: 8080
    },

    express: {}
}
const defaultNotFoundHandler = QuikNotFoundHandler;
const defaultErrorHandler = QuikErrorHandler;

class QuikServer {
    app: Express;
    httpServer: HTTPServer;

    middlewares: RequestHandler[] = [];
    routes: RoutingDict = {};
    staticDirs: string[] = [];
    crons: QuikCron[] = [];
    ws: QuikWebSocket | undefined;
    io: QuikSocketIO | undefined;
    viewDirs: string[] = [];

    notFoundHandler: RequestHandler | undefined;
    errorHandler: ErrorRequestHandler | undefined;


    config: QuikServerConfig;

    constructor() {
        this.app = express();
        this.config = structuredClone(defaultConfig);
        this.httpServer = http.createServer(
            this.app
        );

        this.io = undefined;
        this.ws = undefined;

        this.notFoundHandler = defaultNotFoundHandler;
        this.errorHandler = defaultErrorHandler;
    }


    setConfig(config: Partial<QuikServerConfig>) {
        this.config = {
            ...this.config,
            ...config,
            http: {
                ...this.config.http,
                ...config.http
            },
            express: {
                ...this.config.express,
                ...config.express
            }
        };

        // Notify if the provided time zone is invalid
        if (config.timeZone && !isValidTimeZone(config.timeZone)) {
            const messages = translate(this.config.language, "time");

            logger.warning(
                `${messages.invalidTimeZone1} ${config.timeZone}. ${messages.invalidTimeZone2}`
            );
        }

        return this;
    }

    setNotFoundHandler(handler: RequestHandler | null) {
        if (!handler) {
            this.notFoundHandler = undefined;
            return this;
        }
        this.notFoundHandler = handler;

        return this;
    }

    setErrorHandler(handler: ErrorRequestHandler | null) {
        if (!handler) {
            this.errorHandler = undefined;
            return this;
        }
        this.errorHandler = handler;

        return this;
    }

    addMiddleware(...middlewares: RequestHandler[]) {
        this.middlewares.push(
            ...middlewares
        );

        return this;
    }

    addRoute(path: string, router: QuikRouter) {
        if (!(router instanceof QuikRouter)) {
            throw new ServerInvalidRouteError(path)
        }

        if (!path.startsWith("/"))
            path = "/" + path;

        this.routes[path] = router;

        return this;
    }


    addViewDir(...paths: string[]) {
        for (const view of paths) {
            const viewPath = path.resolve(view);

            if (!fs.existsSync(viewPath)) {
                const messages = translate(this.config.language, "server");

                logger.warning(
                    `[ VIEW ] "${view}" ${messages.view_warn}`
                );

                continue;
            }

            this.viewDirs.push(viewPath);
        }

        return this;
    }

    addCron(cron: QuikCron) {
        if (cron.constructor.name != "QuikCron") {
            throw new ServerInvalidCronError()
        }
        this.crons.push(cron);

        return this;
    }

    useWebSocket(ws: QuikWebSocket) {
        if (ws.constructor.name != "QuikWebSocket") {
            throw new ServerInvalidWebSocketError()
        }
        this.ws = ws;
        return this;
    }

    useSocketIO(socket: QuikSocketIO) {
        if (socket?.constructor.name != "QuikSocketIO") {
            throw new ServerInvalidSocketIOError()
        }
        this.io = socket;

        return this;
    }

    addStaticDir(...paths: string[]) {
        for (const dir of paths) {
            const dirPath = path.resolve(dir);

            if (!fs.existsSync(dirPath)) {
                const messages = translate(this.config.language, "server");
                logger.warning(
                    `[ STATIC ] "${dir}" ${messages.static_warn}`
                );

                continue;
            }

            this.staticDirs.push(dirPath);
        }

        return this;
    }

    #configureExpress() {
        const config = this.config.express;
        const { name, env, trustProxy, viewEngine } = config;

        if (trustProxy) {
            this.app.set(
                "trust proxy",
                config.trustProxy
            );
        }

        if (env) {
            this.app.set("env", config.env);
        }

        if (name) {
            this.app.set("name", name);
        }

        if (viewEngine) {
            this.app.set("view engine", viewEngine);
        }

        if (this.viewDirs.length > 0) {
            const messages = translate(this.config.language, "server")
            logger.info(`[  VIEWS  ] ${this.viewDirs.length} ${messages.views_loaded}.`)
            this.app.set("views", this.viewDirs);
        }

        return this;
    }

    #configureMiddleware() {
        const bodyParser = this.config.bodyParser;

        switch (bodyParser.type) {
            case "json":
                this.app.use(
                    express.json(bodyParser.options)
                );
                break;


            case "urlencoded":
                this.app.use(
                    express.urlencoded(bodyParser.options)
                );
                break;


            case "raw":
                this.app.use(
                    express.raw(bodyParser.options)
                );
                break;


            case "text":
                this.app.use(
                    express.text(bodyParser.options)
                );
                break;

        }

        if (this.middlewares.length > 0)
            this.app.use(...this.middlewares);

        return this;
    }

    #loadRoutes() {
        for (const [path, router] of Object.entries(this.routes)) {
            this.app.use(
                path,
                router.router
            );
        }
        const messages = translate(this.config.language, "server");
        if (Object.entries(this.routes).length > 0) {
            logger.info(`[ ROUTER ] ${Object.entries(this.routes).length} ${messages.routers_loaded}.`);
        }
        return this;
    }

    #loadCrons() {
        for (const cron of this.crons) {
            cron.start();
        }

        const messages = translate(this.config.language, "server")
        if (this.crons.length > 0) {
            logger.info(`[  CRON  ] ${this.crons.length} ${messages.crons_loaded}.`)
        }

        return this;
    }

    #loadWS() {
        if (this.ws) {
            this.ws.start(this.httpServer);
        }

        const messages = translate(this.config.language, "server")
        if (this.ws) {
            logger.info(`[   WS   ] ${messages.socket_loaded}.`)
        }

        return this;
    }

    #loadIO() {
        if (this.io) {
            this.io.start(this.httpServer);
        }

        const messages = translate(this.config.language, "server")
        if (this.io) {
            logger.info(`[ SOCKET ] ${messages.socket_loaded}.`)
        }

        return this;
    }

    #loadStaticDirs() {
        for (const dir of this.staticDirs) {
            const dirPath = path.resolve(dir);

            this.app.use(express.static(dirPath));
        }

        const messages = translate(this.config.language, "server")
        if (this.staticDirs.length > 0) {
            logger.info(`[ STATIC ] ${this.staticDirs.length} ${messages.static_loaded}.`)
        }

        return this;
    }

    #loadHandlers() {
        if (this.notFoundHandler) {
            this.app.use(
                this.notFoundHandler
            );
        }

        if (this.errorHandler) {
            this.app.use(
                this.errorHandler
            );
        }
    }

    #configureHTTP() {
        const config = this.config.http;

        if (config.timeout)
            this.httpServer.timeout = config.timeout;

        if (config.keepAlive)
            this.httpServer.keepAliveTimeout = config.keepAlive;

        if (config.maxConnections)
            this.httpServer.maxConnections = config.maxConnections;

        return this;
    }

    #listen() {
        const { port, host } = this.config.http;
        const messages = translate(this.config.language, "server");

        this.httpServer.listen(port, host, () => {
            logger.info(`${messages.start} ${host ?? "localhost"}:${port}`);
        }
        );

        return this;
    }

    start() {
        this.#configureExpress();
        this.#configureMiddleware();

        this.#loadStaticDirs()
        this.#loadRoutes();
        this.#loadHandlers();
        this.#loadCrons();
        this.#loadWS();
        this.#loadIO();

        this.#configureHTTP();

        this.#listen();
        return this;
    }
}

function Server() {
    return new QuikServer();
}

export {
    Server
};
