import request from 'supertest';
import { app } from '../index';
import * as accountHandler from '../handlers/accountHandler';
import * as transactionHandler from '../handlers/transactionHandler';

jest.mock('../handlers/accountHandler');
jest.mock('../handlers/transactionHandler');

describe('Accounts API Endpoints (Starter Functionality)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /accounts/:accountID', () => {
    it('returns 200 and account data when account exists', async () => {
      const mockAccount = {
        account_number: '1',
        name: 'John Doe',
        amount: 500,
        type: 'checking',
        credit_limit: null,
      };

      (accountHandler.getAccount as jest.Mock).mockResolvedValue(mockAccount);

      const res = await request(app).get('/accounts/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAccount);
      expect(accountHandler.getAccount).toHaveBeenCalledWith('1');
    });

    it('returns 404 when account is not found', async () => {
      (accountHandler.getAccount as jest.Mock).mockRejectedValue(new Error('Account not found'));

      const res = await request(app).get('/accounts/999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
      expect(res.body.error.message).toBe('Account not found');
      expect(res.body.error.traceId).toBeDefined();
    });
  });
});

describe('Transactions API Endpoints (Starter Functionality)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /transactions/:accountID/withdraw', () => {
    it('returns 200 and updated account on successful withdrawal', async () => {
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
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedAccount);
      expect(transactionHandler.withdrawal).toHaveBeenCalledWith('1', 50);
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
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedAccount);
      expect(transactionHandler.deposit).toHaveBeenCalledWith('1', 50);
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
