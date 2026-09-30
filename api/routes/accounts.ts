import express, { Request, Response } from "express";
import Joi, { Schema } from "joi";
import { getAccount } from "../handlers/accountHandler";
import { sendApiError } from "../utils/errors";

const router = express.Router();

const getAccountSchema: Schema = Joi.string().required();

router.get("/:accountID", async (request: Request, response: Response) => {
  const { error } = getAccountSchema.validate(request.params.accountID);
  const traceId = response.locals.traceId;
  
  if (error) {
    return sendApiError(response, 400, "INVALID_INPUT", error.details[0].message, traceId);
  }

  try {
    const account = await getAccount(request.params.accountID);
    return response.status(200).json(account);
  } catch (err) {
    return sendApiError(response, 404, "ACCOUNT_NOT_FOUND", "Account not found", traceId);
  }
});

export default router;
