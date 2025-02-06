import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

const USER_URL = process.env.USER_URL;
const PRODUCT_URL = process.env.PRODUCT_URL;
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL;
const ORDER_URL = process.env.ORDER_URL;
const CART_URL = process.env.CART_URL;

export const authenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.headers.cookie?.split("=").at(1) ||
      req.headers.authorization?.split(" ").at(1);
    const response = await fetch(`${USER_URL}/api/v1/users/getMe`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return next(new AppError("Failed to authenticate user. Try again.", 403));
    }

    const data = await response.json();
    req.user = data.data;
    req.token = token;
    next();
  }
);

export const restrictTo = (role: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const response = await fetch(`${USER_URL}/api/v1/users/getMe`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.token}`,
      },
    });

    if (!response.ok) {
      return next(new AppError("Failed to authenticate user. Try again.", 403));
    }

    const user = await response.json();

    if (user.data.role !== role) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  });

export const afterPaymentOperations = async (
  next: NextFunction,
  orderId: any,
  token: string,
  userId: number
) => {
  // Update the order to paid.
  const responseOrder = await fetch(`${ORDER_URL}/api/v1/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "paid" }),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!responseOrder.ok) {
    return next(new AppError("Failed to complete payment. Try again", 500));
  }

  // Clear the cart.
  const responseCart = await fetch(`${CART_URL}/api/v1/cart/${userId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!responseCart.ok) {
    return next(new AppError("Failed to clear cart. Try again", 500));
  }

  // Update product quantity
  const responseProducts = await fetch(
    `${ORDER_URL}/api/v1/orders/${orderId}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!responseProducts.ok) {
    return next(new AppError("Failed to fetch products. Try again", 500));
  }

  const productsData = await responseProducts.json();
  const products = productsData.data.products;

  async function updateItems(products: any) {
    const productDetails = await Promise.all(
      products.map((product: any) =>
        fetch(`${PRODUCT_URL}/api/v1/products/${product.product_id}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => res.json())
      )
    );

    //Prepare stock updates
    const updatePromises = products.map((product: any, index: number) => {
      const productStock = productDetails[index].data.stock;
      const stockUpdate = productStock - product.quantity;

      return fetch(`${PRODUCT_URL}/api/v1/products/${product.product_id}`, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ stock: stockUpdate }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    });

    const updateResponses = await Promise.all(updatePromises);

    //Check if any update failed
    const failedUpdates = updateResponses.filter((res) => !res.ok);
    if (failedUpdates.length > 0) {
      return next(new AppError("Some product stock updates failed", 500));
    }
  }

  await updateItems(products);
  //Send Notifications

  // Send notification
  const responseNotification = await fetch(
    `${NOTIFICATIONS_URL}/api/v1/sendReceipt/${orderId}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!responseNotification.ok) {
    return next(new AppError("Failed to send notifications. Try again", 500));
  }
};
