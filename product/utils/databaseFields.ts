import { NextFunction } from "express";
import AppError from "./appError";

export const checkRequiredFields = (
  fields: any,
  data: any,
  next: NextFunction
) => {
  for (const field of fields) {
    if (!(field in data)) {
      return next(new AppError(`${field} is required`, 400));
    }
  }
};

export const dynamicQuery = (data: any) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");

  return { keys, values, placeholders };
};

export const checkUpdateFields = (updateData: any, next: NextFunction) => {
  if (Object.keys(updateData).length === 0) {
    return next(new AppError("No fields to update", 400));
  }
};

export const updateClause = (
  updateData: any,
  id: string,
  next: NextFunction
) => {
  // Dynamically build the SET clause
  const setClause = Object.keys(updateData)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const values = [...Object.values(updateData), id];
  return { setClause, values };
};
