import express, { type Express, type RequestHandler } from "express";
import http, { type Server as HTTPServer } from "node:http";

import type { QuickRouter } from "./router.js";
import { logger } from "./logger.js";
import { httpErrorHandler } from "../handlers/httpErrorHandler.js";
import { notFoundHandler } from "../handlers/notFoundHandler.js";
import { translate } from "./translator.js";

type Language = "en" | "es";
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
    bodyParser: BodyParserConfig;
    http: HTTPConfig;
    express: ExpressConfig;
};
type RoutingDict = Record<string, QuickRouter>;

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

class QuikServer {
    app: Express;
    httpQuikServer: HTTPServer;
    middlewares: RequestHandler[] = [];
    routes: RoutingDict = {};
    config: QuikServerConfig;

    constructor() {
        this.app = express();
        this.config = structuredClone(defaultConfig);
        this.httpQuikServer = http.createServer(
            this.app
        );
    }

    configure(config: Partial<QuikServerConfig>) {
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

        return this;
    }

    middleware(...middlewares: RequestHandler[]) {
        this.middlewares.push(
            ...middlewares
        );

        return this;
    }

    route(path: string, router: QuickRouter) {
        this.routes[path] = router;
        return this;
    }


    listen() {
        const { port, host } = this.config.http;
        const messages = translate(this.config.language, "server");

        this.httpQuikServer.listen(port, host, () => {
                logger.custom(messages.name, "green", null, `${messages.start} ${host ?? "localhost"}:${port}`);
            }
        );

        return this;
    }

    #configureHTTP() {
        const config = this.config.http;

        if (config.timeout)
            this.httpQuikServer.timeout = config.timeout;

        if (config.keepAlive)
            this.httpQuikServer.keepAliveTimeout = config.keepAlive;

        if (config.maxConnections)
            this.httpQuikServer.maxConnections = config.maxConnections;

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

        return this;
    }

    start() {
        this.#configureExpress();
        this.#configureMiddleware();
        this.#configureRoutes();

        this.#configureHTTP();

        this.listen();
        return this;
    }
}

function Server() {
    return new QuikServer();
}

export {
    Server
};