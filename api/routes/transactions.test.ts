import request from 'supertest';
import { app } from '../index';
import * as transactionHandler from '../handlers/transactionHandler';
import { TransactionError } from '../utils/errors';

jest.mock('../handlers/transactionHandler');

describe('Transactions API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /transactions/:accountID/withdraw', () => {
    it('returns 200 and updated account on successful withdrawal', async () => {
      const idempotencyKey = '11111111-1111-4111-8111-111111111111';
      const traceId = '33333333-3333-4333-8333-333333333333';
      const mockUpdatedAccount = {
        account_number: '1',
        name: 'John Doe',
        amount: 450,
        type: 'checking',
        credit_limit: null,
      };

      (transactionHandler.withdrawal as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      const res = await request(app)
        .put('/transactions/1/withdraw')
        .set('Idempotency-Key', idempotencyKey)
        .set('X-Trace-Id', traceId)
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedAccount);
      expect(res.headers['x-trace-id']).toBe(traceId);
      expect(res.headers['idempotency-key']).toBe(idempotencyKey);
      expect(transactionHandler.withdrawal).toHaveBeenCalledWith('1', 50, {
        idempotencyKey,
        traceId,
      });
    });

    it('returns 400 when amount validation fails (missing amount)', async () => {
      const res = await request(app)
        .put('/transactions/1/withdraw')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(res.body.error.message).toContain('"amount" is required');
      expect(res.body.error.traceId).toBeDefined();
    });

    it.each([0, -5, 2.5, '50'])('returns 400 for invalid withdrawal amount %s', async (amount) => {
      const res = await request(app)
        .put('/transactions/1/withdraw')
        .send({ amount });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(transactionHandler.withdrawal).not.toHaveBeenCalled();
    });

    it('returns a withdrawal rule error from the handler', async () => {
      (transactionHandler.withdrawal as jest.Mock).mockRejectedValue(
        new TransactionError(
          'WITHDRAWAL_LIMIT_EXCEEDED',
          'Withdrawals cannot exceed $200'
        )
      );

      const res = await request(app)
        .put('/transactions/1/withdraw')
        .send({ amount: 205 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('WITHDRAWAL_LIMIT_EXCEEDED');
      expect(res.body.error.message).toBe('Withdrawals cannot exceed $200');
      expect(res.body.error.traceId).toBeDefined();
    });

    it('returns 400 when transaction handler throws an error', async () => {
      (transactionHandler.withdrawal as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const res = await request(app)
        .put('/transactions/1/withdraw')
        .send({ amount: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TRANSACTION_FAILED');
      expect(res.body.error.message).toBe('Transaction failed');
      expect(res.body.error.traceId).toBeDefined();
    });
  });

  describe('PUT /transactions/:accountID/deposit', () => {
    it('returns 200 and updated account on successful deposit', async () => {
      const idempotencyKey = '22222222-2222-4222-8222-222222222222';
      const mockUpdatedAccount = {
        account_number: '1',
        name: 'John Doe',
        amount: 550,
        type: 'checking',
        credit_limit: null,
      };

      (transactionHandler.deposit as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      const res = await request(app)
        .put('/transactions/1/deposit')
        .set('Idempotency-Key', idempotencyKey)
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedAccount);
      expect(res.headers['x-trace-id']).toBeDefined();
      expect(res.headers['idempotency-key']).toBe(idempotencyKey);
      expect(transactionHandler.deposit).toHaveBeenCalledWith('1', 50, {
        idempotencyKey,
        traceId: expect.any(String),
      });
    });

    it('returns 400 when amount validation fails (missing amount)', async () => {
      const res = await request(app)
        .put('/transactions/1/deposit')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(res.body.error.message).toContain('"amount" is required');
      expect(res.body.error.traceId).toBeDefined();
    });

    it.each([0, -1, 1.5, '50'])('returns 400 for invalid deposit amount %s', async (amount) => {
      const res = await request(app)
        .put('/transactions/1/deposit')
        .send({ amount });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(transactionHandler.deposit).not.toHaveBeenCalled();
    });

    it('returns a deposit rule error from the handler', async () => {
      (transactionHandler.deposit as jest.Mock).mockRejectedValue(
        new TransactionError(
          'DEPOSIT_LIMIT_EXCEEDED',
          'Deposits cannot exceed $1000'
        )
      );

      const res = await request(app)
        .put('/transactions/1/deposit')
        .send({ amount: 1001 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DEPOSIT_LIMIT_EXCEEDED');
      expect(res.body.error.message).toBe('Deposits cannot exceed $1000');
      expect(res.body.error.traceId).toBeDefined();
    });

    it('returns 400 when transaction handler throws an error', async () => {
      (transactionHandler.deposit as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const res = await request(app)
        .put('/transactions/1/deposit')
        .send({ amount: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TRANSACTION_FAILED');
      expect(res.body.error.message).toBe('Transaction failed');
      expect(res.body.error.traceId).toBeDefined();
    });
  });
});
