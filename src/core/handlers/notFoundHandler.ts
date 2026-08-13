import type { RequestHandler } from "express";
import { Status } from "../../http/index.js";

export const QuikNotFoundHandler: RequestHandler = (req, res) => {
    res.status(Status.NOT_FOUND).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};