import type { Request, Response } from "express";
import { logger } from "../logger.js";

export function httpErrorHandler(req: Request,res: Response) {
    logger.error("No deberia estar aqui")
}