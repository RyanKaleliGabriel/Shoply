import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db/con";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { correctPassword, hashPassword } from "../utils/userUtils";
import validator from "validator";

// Generate a signed JWT token with the user's id
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (
  user: any,
  statusCode: number,
  res: Response,
  req: Request
) => {
  const token = signToken(user.id);
  user.password = undefined;

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header("X-forwaded-proto") === "https",
  });

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};


export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Get the jwt token in the headers or cookies.
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // return an error if there is no token
    if (!token || token === "loggedOut") {
      return next(
        new AppError("You are not logged in! Please login to get access!", 401)
      );
    }

    // Verify the token
    const verifyToken = (token: string, secret: string) =>
      new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err: any, decoded: any) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

    const decoded: any = await verifyToken(token, process.env.JWT_SECRET!);

    // Check if the user still exists
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (user.rows.length === 0) {
      return next(
        new AppError("The user belonging to this token no longer exists", 401)
      );
    }
    // Check if user changed password after token was issued

    //Initialise req.user as the user (Protect the user)
    req.user = user.rows[0];
    next();
  }
);

export const restrictTo = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (role !== req.user.role) {
      return next(new AppError("Request restricted to authorized users", 403));
    }
    next();
  };
};

// Create a new User.
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    if (
      !username ||
      typeof username !== "string" ||
      validator.isEmpty(username.trim())
    ) {
      return next(new AppError("Username must be a non-empty string", 400));
    }

    if (!email || typeof email !== "string" || !validator.isEmail(email)) {
      return next(new AppError("Please provide a valid email", 400));
    }
    const hashedPassword = await hashPassword(password);
    console.log(hashPassword)
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );
    const user = result.rows[0];
    console.log(user);
    createSendToken(user, 201, res, req);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if the inputs are present
    if (!email || !password) {
      return next(new AppError("Provide email and password!", 400));
    }

    // Query the user using the email input.
    const result = await pool.query(
      "SELECT * FROM users u WHERE u.email = $1",
      [email]
    );
    const user = result.rows[0];

    // Check if the user exists and if password is correct
    if (!user || !(await correctPassword(password, user.password))) {
      return next(new AppError("Invalid email or password!", 401));
    }

    createSendToken(user, 200, res, req);
  }
);

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "loggedOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Get the user using req.user.id
    const result = await pool.query("SELECT * FROM users WHERE id = $1 ", [
      req.user.id,
    ]);
    const user = result.rows[0];
    console.log(user)

    // Validate the current password
    if (!(await correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError("Current password is not correct", 401));
    }

    // Validate that the current password and the new password are not the same
    if (await correctPassword(req.body.password, user.password)) {
      return next(
        new AppError(
          "Previous passwords cannot be same with the new password",
          401
        )
      );
    }
    // // Update the password
    const hashedPassword = await hashPassword(req.body.password)
    const passwordUpdateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2 RETURNING *",
      [hashedPassword, user.id]
    );
    const updatedUser = passwordUpdateResult.rows[0];

    //Send the jwt token
    createSendToken(updatedUser, 201, res, req);
  }
);
