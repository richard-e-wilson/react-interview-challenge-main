import express, { Request, Response } from "express";
import Joi, { Schema } from "joi";
import { deposit, withdrawal } from "../handlers/transactionHandler";
import { sendApiError } from "../utils/errors";

const router = express.Router();

const transactionSchema: Schema = Joi.object({
  amount: Joi.number().required(),
});

router.put("/:accountID/withdraw", async (request: Request, response: Response) => {
  const { error } = transactionSchema.validate(request.body);

  if (error) {
    return sendApiError(response, 400, "INVALID_INPUT", error.details[0].message);
  }

  try {
    const updatedAccount = await withdrawal(request.params.accountID, request.body.amount);
    return response.status(200).json(updatedAccount);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transaction failed";
    return sendApiError(response, 400, "TRANSACTION_FAILED", message);
  }
});

router.put("/:accountID/deposit", async (request: Request, response: Response) => {
  const { error } = transactionSchema.validate(request.body);

  if (error) {
    return sendApiError(response, 400, "INVALID_INPUT", error.details[0].message);
  }

  try {
    const updatedAccount = await deposit(request.params.accountID, request.body.amount);
    return response.status(200).json(updatedAccount);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transaction failed";
    return sendApiError(response, 400, "TRANSACTION_FAILED", message);
  }
});

export default router;