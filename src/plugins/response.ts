import { ResponseSuccess, ResponseError } from "../utils/response";
// @ts-ignore
import { Elysia } from "elysia";

export const responsePlugin = (app: Elysia) =>
  app.derive(() => ({
    resSuccess: <T = any>(
      data?: T,
      message: string = "success",
      code: number = 0
    ) => ResponseSuccess(code, message, data),
    resError: <T = any>(
      message: string,
      code: number = 1,
      data: T | null = null
    ) => ResponseError(code, message, data),
  }));
