import { getAccount } from './accountHandler';
import { withdrawal, deposit } from './transactionHandler';
import * as db from '../utils/db';

jest.mock('../utils/db');

describe('Account & Transaction Handlers Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccount', () => {
    it('returns account object when database row exists', async () => {
      const mockAccountRow = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
        rows: [mockAccountRow],
      });

      const result = await getAccount('1');
      expect(result).toEqual(mockAccountRow);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
    });

    it('throws "Account not found" when rowCount is 0', async () => {
      (db.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
        rows: [],
      });

      await expect(getAccount('99')).rejects.toThrow('Account not found');
    });
  });

  describe('withdrawal', () => {
    it('updates account balance and returns updated account', async () => {
      const mockInitialAccount = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [mockInitialAccount] }) // getAccount
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE query

      const result = await withdrawal('1', 200);

      expect(result.amount).toBe(800);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [800, '1']);
    });

    it('throws "Transaction failed" when UPDATE query fails (rowCount 0)', async () => {
      const mockInitialAccount = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [mockInitialAccount] })
        .mockResolvedValueOnce({ rowCount: 0 });

      await expect(withdrawal('1', 200)).rejects.toThrow('Transaction failed');
    });
  });

  describe('deposit', () => {
    it('updates account balance and returns updated account', async () => {
      const mockInitialAccount = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [mockInitialAccount] }) // getAccount
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE query

      const result = await deposit('1', 300);

      expect(result.amount).toBe(1300);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [1300, '1']);
    });

    it('throws "Transaction failed" when UPDATE query fails (rowCount 0)', async () => {
      const mockInitialAccount = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [mockInitialAccount] })
        .mockResolvedValueOnce({ rowCount: 0 });

      await expect(deposit('1', 300)).rejects.toThrow('Transaction failed');
    });
  });
});
