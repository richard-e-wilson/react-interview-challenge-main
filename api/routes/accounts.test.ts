import request from 'supertest';
import { app } from '../index';
import * as accountHandler from '../handlers/accountHandler';

jest.mock('../handlers/accountHandler');

describe('Accounts API Endpoints', () => {
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
      expect(res.body.error.traceId).toBe(res.headers['x-trace-id']);
    });
  });
});
