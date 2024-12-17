import { NextFunction, Request, Response } from "express";

export const getOrders = (req: Request, res: Response, next: NextFunction) => {
  const data = "This is protected data! Congrats here are your posts.";

  res.status(200).json({
    status: "success",
    data: {
      data,
    },
  });
};
