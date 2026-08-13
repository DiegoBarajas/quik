import type { ErrorRequestHandler, Request, Response, Errback } from "express";
import { logger } from "../logger.js";
import { Status } from "../../http/index.js";

export const QuikErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logger.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(Status.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error"
    });
};