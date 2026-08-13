import express, { type ErrorRequestHandler, type Express, type RequestHandler } from "express";
import http, { type Server as HTTPServer } from "node:http";
import path from "node:path";
import fs from "node:fs";

import { QuikRouter } from "./router.js";
import { logger } from "./logger.js";
import { translate } from "./translator.js";
import { isValidTimeZone } from "./time.js";
import { QuikCron } from "../cron/cron.js";


import { ServerInvalidCronError, ServerInvalidRouteError } from "./errors/serverErrors.js";
import { QuikNotFoundHandler } from "./handlers/notFoundHandler.js";
import { QuikErrorHandler } from "./handlers/httpErrorHandler.js";

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
    trustProxy?: boolean;
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

    notFoundHandler: RequestHandler | undefined;
    errorHandler: ErrorRequestHandler | undefined;


    config: QuikServerConfig;

    constructor() {
        this.app = express();
        this.config = structuredClone(defaultConfig);
        this.httpServer = http.createServer(
            this.app
        );

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
        if(!handler){
            this.notFoundHandler = undefined;
            return this;
        }
        this.notFoundHandler = handler;

        return this;
    }

    setErrorHandler(handler: ErrorRequestHandler | null) {
        if(!handler){
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


    #listen() {
        const { port, host } = this.config.http;
        const messages = translate(this.config.language, "server");

        this.httpServer.listen(port, host, () => {
            logger.info(`${messages.start} ${host ?? "localhost"}:${port}`);
        }
        );

        return this;
    }

    addCron(cron: QuikCron) {
        if (cron.constructor.name != "QuikCron") {
            throw new ServerInvalidCronError()
        }
        this.crons.push(cron);

        return this;
    }

    addStaticDir(...paths: string[]) {
        for (const i in paths) {
            const dir = paths[i] ?? "";
            const dirPath = path.resolve(dir);

            const exists = fs.existsSync(dirPath)
            if (!exists) {
                const messages = translate(this.config.language, "server");
                logger.warning(`[ STATIC ] "${dir}" ${messages.static_warn}`);
                continue;
            }
            this.staticDirs.push(...paths);
        }

        return this;
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

    #configureExpress() {
        const config = this.config.express;

        if (config.trustProxy !== undefined) {
            this.app.set(
                "trust proxy",
                config.trustProxy
            );

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


    #configureRoutes() {
        for (const [path, router] of Object.entries(this.routes)) {
            this.app.use(
                path,
                router.router
            );
        }
        const messages = translate(this.config.language, "server");
        logger.info(`[ ROUTER ] ${Object.entries(this.routes).length} ${messages.routers_loaded}.`);
        return this;
    }

    #loadCrons() {
        for (const cron of this.crons) {
            cron.start();
        }

        const messages = translate(this.config.language, "server")
        logger.info(`[  CRON  ] ${this.crons.length} ${messages.crons_loaded}.`)

        return this;
    }

    #loadStaticDirs() {
        for (const dir of this.staticDirs) {
            const dirPath = path.resolve(dir);

            this.app.use(express.static(dirPath));
        }

        const messages = translate(this.config.language, "server")
        logger.info(`[ STATIC ] ${this.staticDirs.length} ${messages.static_loaded}.`)

        return this;
    }

    #loadHandlers() {
        if(this.notFoundHandler){
            this.app.use(
                this.notFoundHandler
            );
        }

        if(this.errorHandler){
            this.app.use(
                this.errorHandler
            );
        }
    }

    start() {
        this.#configureExpress();
        this.#configureMiddleware();

        this.#loadStaticDirs()
        this.#configureRoutes();
        this.#loadHandlers();
        this.#loadCrons();

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
