import { Response } from 'express';
import { ApiError, ApiErrorCode } from '../types';
import crypto from 'crypto';

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
