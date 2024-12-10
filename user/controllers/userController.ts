import { NextFunction, Request, Response } from "express";

export const getUser = (req: Request, res: Response, next: NextFunction) => {
  const hello = "Hello from the user service!";
  res.status(200).json({
    status: "success",
    data: {
      data: hello,
    },
  });
};
