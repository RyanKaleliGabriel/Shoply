import { NextFunction, Request, Response } from "express";
import validator from "validator";
import pool from "../db/con";
import {
  dbQueryDurationHistogram,
  loginUsersGauge,
  requestCounter,
} from "../middleware/prometheusMiddleware";
import { createSendToken } from "../middleware/userMiddleware";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import {
  checkRequiredFields,
  checkUpdateFields,
  updateClause,
} from "../utils/databaseFields";
import { correctPassword, hashPassword } from "../utils/userUtils";
import { performance } from "perf_hooks";

// Create a new User.
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requiredFields = ["username", "email", "password"];
    let userData = req.body;
    const role = req.body.role ?? "user";
    userData = { ...userData, role };

    // Validate required fields
    checkRequiredFields(requiredFields, userData, next);
    if (!validator.isEmail(userData.email)) {
      return next(new AppError("Please provide a valid email", 400));
    }
    const hashedPassword = await hashPassword(userData.password);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [userData.username, userData.email, hashedPassword, role]
    );
    const user = result.rows[0];
    requestCounter.labels(req.method, req.originalUrl).inc();
    createSendToken(user, 201, res, req);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requiredFields = ["email", "password"];
    const loginData = req.body;
    checkRequiredFields(requiredFields, loginData, next);

    // Query the user using the email input.
    const result = await pool.query(
      "SELECT * FROM users u WHERE u.email = $1",
      [loginData.email]
    );
    const user = result.rows[0];

    // Check if the user exists and if password is correct
    if (!user || !(await correctPassword(loginData.password, user.password))) {
      return next(new AppError("Invalid email or password!", 401));
    }

    loginUsersGauge.inc();
    requestCounter.labels(req.method, req.originalUrl).inc();
    createSendToken(user, 200, res, req);
  }
);

export const logout = (req: Request, res: Response) => {
  loginUsersGauge.dec();
  res.cookie("jwt", "loggedOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  requestCounter.labels(req.method, req.originalUrl).inc();
  res.status(200).json({ status: "success" });
};

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Get the user using req.user.id
    const result = await pool.query("SELECT * FROM users WHERE id = $1 ", [
      req.user.id,
    ]);
    const user = result.rows[0];

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
    const hashedPassword = await hashPassword(req.body.password);

    const passwordUpdateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2 RETURNING *",
      [hashedPassword, user.id]
    );
    const updatedUser = passwordUpdateResult.rows[0];
    requestCounter.labels(req.method, req.originalUrl).inc();
    //Send the jwt token
    createSendToken(updatedUser, 201, res, req);
  }
);

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    requestCounter.labels(req.method, req.originalUrl).inc();
    const dbQueryStart = performance.now();
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    const user = result.rows[0];
    if (!user) {
      return next(new AppError("No user found with that id", 404));
    }

    requestCounter.labels(req.method, req.originalUrl).inc();
    res.status(200).json({
      status: "success",
      data: user,
    });
  }
);

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user.id;
    const updates = req.body;

    checkUpdateFields(updates, next);
    const { setClause, values } = updateClause(updates, id, next);

    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id=$1 RETURNING *`,
      values
    );

    const user = result.rows[0];
    requestCounter.labels(req.method, req.originalUrl).inc();
    res.status(201).json({
      status: "success",
      data: user,
    });
  }
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("DELETE FROM users WHERE id=$1", [
      req.user.id,
    ]);
    const user = result.rows[0];
    requestCounter.labels(req.method, req.originalUrl).inc();
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CALLBACK_URL = "http://127.0.0.1/api/v1/users/google/callback";
const GOOGLE_OAUTH_SCOPES = [
  "https%3A//www.googleapis.com/auth/userinfo.email",

  "https%3A//www.googleapis.com/auth/userinfo.profile",
];

// Oauth 2
export const signINGoogle = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const state = "some_state";
    const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`;
    res.status(200).json({
      status: "success",
      data: { data: GOOGLE_OAUTH_CONSENT_SCREEN_URL },
    });
  }
);

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;

export const googleRedirect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.query;
    if (!code) {
      return next(new AppError("Authorization code is missing", 400));
    }

    const data = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: "http://127.0.0.1/api/v1/users/google/callback",
      grant_type: "authorization_code",
    };
    const response = await fetch(GOOGLE_ACCESS_TOKEN_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const access_token_data = await response.json();
    if (!response) {
      next(new AppError("Failed to fetch access token", 404));
    }

    // Verify and extract information in the Google ID token
    const { id_token } = access_token_data;

    const token_info_response = await fetch(
      `${process.env.GOOGLE_TOKEN_INFO_URL}?id_token=${id_token}`
    );

    const token_info_data = await token_info_response.json();
    const { email, name } = token_info_data;

    //  Use the information in the Google ID token to manage user authentication
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      const insertResult = await pool.query(
        "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
        [name, email]
      );
      const newUser = insertResult.rows[0];
      createSendToken(newUser, 201, res, req);
    }
    requestCounter.labels(req.method, req.originalUrl).inc();
    createSendToken(user, 200, res, req);
  }
);
