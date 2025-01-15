import validator from "validator";
import { NextFunction } from "express";
import AppError from "./appError";

export const stringValidator = (
  value: string,
  name: string,
  next: NextFunction
) => {
  if (!value || typeof value !== "string" || validator.isEmpty(value.trim())) {
    return next(new AppError(`Incorrect format for ${name}. Try again.`, 400));
  }
};

export const numberValidator = async (
  value: number,
  name: string,
  next: NextFunction
) => {
  const numberError: Error[] = [];
  if (!value || typeof value !== "number") {
    return next(new AppError(`Incorrect format for ${name}. Try again.`, 400));
  }
  return numberError;
};
