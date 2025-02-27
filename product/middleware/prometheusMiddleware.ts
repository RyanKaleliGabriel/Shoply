import { NextFunction, Request, Response } from "express";
import client, { Counter, Gauge, Histogram, Summary } from "prom-client";
import catchAsync from "../utils/catchAsync";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Metrics Controller
export const metricsRegistry = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  }
);

// Prometheus metrics
export const requestCounter = new Counter({
  name: "http_request_total",
  help: "Total number of http requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(requestCounter);

export const dbQueryDurationHistogram = new Histogram({
  name: "db_query_duration_seconds",
  help: "Histogram of database query durations in seconds",
  labelNames: ["methods", "route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1],
});
register.registerMetric(dbQueryDurationHistogram);

export const responseSizeSummary = new Summary({
  name: "http_response_size_bytes",
  help: "Summary of http response size in bytes",
  labelNames: ["method", "route"],
});
register.registerMetric(responseSizeSummary);

// Histogram to measure request latency
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

export const trackResponseSize = catchAsync(
  async (request: Request, response: Response, next: NextFunction) => {
    const originalSend = response.send;

    response.send = function (body: any) {
      try {
        const route = request.originalUrl || request.path;
        const responseSizeBytes = Buffer.byteLength(
          JSON.stringify(body || ""),
          "utf8"
        );

        responseSizeSummary
          .labels(request.method, route)
          .observe(responseSizeBytes);
      } catch (error) {
        console.error("Error tracking response size:", error);
      }

      return originalSend.call(this, body);
    };
    return next();
  }
);

export const latencyAndThroughput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.originalUrl, res.statusCode.toString())
      .observe(duration);
    requestCounter.labels(req.method, req.originalUrl, res.statusCode.toString()).inc();
  });
  next();
};
