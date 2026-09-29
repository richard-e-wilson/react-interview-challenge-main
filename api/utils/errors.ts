import { Response } from 'express';
import { ApiError, ApiErrorCode } from '../types';
import crypto from 'crypto';

export class TransactionError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

export const sendApiError = (
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  traceId?: string
) => {
  const generatedTraceId = traceId || crypto.randomUUID();
  const errorPayload: { error: ApiError } = {
    error: {
      code,
      message,
      traceId: generatedTraceId,
    },
  };
  return res.status(statusCode).json(errorPayload);
};
