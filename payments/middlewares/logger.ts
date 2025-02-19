import { NextFunction, Request, Response } from "express";
import winston from "winston";
import LokiTransport from "winston-loki";

export const logger = winston.createLogger({
  transports: [
    new LokiTransport({
      host: "http://loki:3100",
      json: true,
      labels: { service: "payments_service" },
      format: winston.format.json(),
    }),
  ],
});

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      message: "Request completed",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      labels: { service: "payments_service" },
    });
  });

  next()
};
