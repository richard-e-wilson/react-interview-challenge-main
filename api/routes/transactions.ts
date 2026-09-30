import express, { Request, Response } from "express";
import crypto from "crypto";
import Joi, { Schema } from "joi";
import { deposit, withdrawal } from "../handlers/transactionHandler";
import { sendApiError, TransactionError } from "../utils/errors";

const router = express.Router();

const transactionSchema: Schema = Joi.object({
  amount: Joi.number().integer().positive().strict().required(),
  idempotencyKey: Joi.string().guid().required(),
});

router.put("/:accountID/withdraw", async (request: Request, response: Response) => {
  const { error, value } = transactionSchema.validate({
    amount: request.body.amount,
    idempotencyKey: request.header("Idempotency-Key") ?? crypto.randomUUID(),
  });
  const traceId = response.locals.traceId;

  if (error) {
    return sendApiError(response, 400, "INVALID_INPUT", error.details[0].message, traceId);
  }

  try {
    response.setHeader("Idempotency-Key", value.idempotencyKey);
    const updatedAccount = await withdrawal(request.params.accountID, value.amount, {
      idempotencyKey: value.idempotencyKey,
      traceId,
    });
    return response.status(200).json(updatedAccount);
  } catch (err) {
    if (err instanceof TransactionError) {
      return sendApiError(response, err.statusCode, err.code, err.message, traceId);
    }

    const message = err instanceof Error ? err.message : "Transaction failed";
    return sendApiError(response, 400, "TRANSACTION_FAILED", message, traceId);
  }
});

router.put("/:accountID/deposit", async (request: Request, response: Response) => {
  const { error, value } = transactionSchema.validate({
    amount: request.body.amount,
    idempotencyKey: request.header("Idempotency-Key") ?? crypto.randomUUID(),
  });
  const traceId = response.locals.traceId;

  if (error) {
    return sendApiError(response, 400, "INVALID_INPUT", error.details[0].message, traceId);
  }

  try {
    response.setHeader("Idempotency-Key", value.idempotencyKey);
    const updatedAccount = await deposit(request.params.accountID, value.amount, {
      idempotencyKey: value.idempotencyKey,
      traceId,
    });
    return response.status(200).json(updatedAccount);
  } catch (err) {
    if (err instanceof TransactionError) {
      return sendApiError(response, err.statusCode, err.code, err.message, traceId);
    }

    const message = err instanceof Error ? err.message : "Transaction failed";
    return sendApiError(response, 400, "TRANSACTION_FAILED", message, traceId);
  }
});

export default router;
