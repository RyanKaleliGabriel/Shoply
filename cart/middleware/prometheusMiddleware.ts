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
  labelNames: ["method", "route"],
});
register.registerMetric(requestCounter)

export const loginUsersGauge = new Gauge({
  name: "logged_in_users",
  help: "Number of currently logged in users",
});
register.registerMetric(loginUsersGauge)

export const dbQueryDurationHistogram = new Histogram({
  name: "db_query_duration_seconds",
  help: "Histogram of database query durations in seconds",
  labelNames: ["methods", "route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1],
});
register.registerMetric(dbQueryDurationHistogram)

export const responseSizeSummary = new Summary({
  name: "http_response_size_bytes",
  help: "Summary of http response size in bytes",
  labelNames: ["method", "route"],
});
register.registerMetric(responseSizeSummary)

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
