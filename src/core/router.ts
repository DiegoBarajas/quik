import type { RequestHandler, Router as RouterType } from "express";
import { Router as ExpressRouter } from "express";

type HttpMethod =
    | "get"
    | "post"
    | "put"
    | "patch"
    | "delete"
    | "options"
    | "head"
    | "all";

class QuikRouter {
    readonly router: RouterType;
    private pendingMiddleware: RequestHandler[] = [];
    private currentPath: string = "";

    constructor() {
        this.router = ExpressRouter();
    }

    middleware(...handlers: RequestHandler[]) {
        this.pendingMiddleware.push(...handlers);
        return this;
    }

    path(path: string) {
        this.currentPath = path;
        return this;
    }

    private register (
        method: HttpMethod,
        handler: RequestHandler
    ) {
        this.router[method](
            this.currentPath,
            ...this.pendingMiddleware,
            async (req, res, next) => {
                try {
                    await handler(req, res, next);
                } catch (err) {
                    next(err);
                }
            }
        );

        this.pendingMiddleware = [];
        this.currentPath = "";

        return this;
    }

    get(handler: RequestHandler) {
        return this.register("get", handler);
    }

    post(handler: RequestHandler) {
        return this.register("post", handler);
    }

    put(handler: RequestHandler) {
        return this.register("put", handler);
    }

    patch(handler: RequestHandler) {
        return this.register("patch", handler);
    }

    delete(handler: RequestHandler) {
        return this.register("delete", handler);
    }
    
}

function Router() {
    return new QuikRouter;
}

export { QuikRouter, Router };