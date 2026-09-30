import { withdrawal, deposit } from './transactionHandler';
import * as db from '../utils/db';
import { TransactionError } from '../utils/errors';

jest.mock('../utils/db');

describe('Transaction Handler Unit Tests', () => {
  const transactionContext = {
    idempotencyKey: '11111111-1111-4111-8111-111111111111',
    traceId: '22222222-2222-4222-8222-222222222222',
  };

  afterEach(() => {
    jest.clearAllMocks();
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
        .mockResolvedValueOnce({ rows: [{ total: '200' }] }) // daily withdrawal total
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE query
        .mockResolvedValueOnce({ rowCount: 1 }); // journal INSERT

      const result = await withdrawal('1', 200, transactionContext);

      expect(result.amount).toBe(800);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("AT TIME ZONE 'UTC'"), ['1']);
      expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), [800, '1']);
      expect(db.query).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('INSERT INTO transactions'),
        ['1', 'withdrawal', 200, 1000, 800, transactionContext.idempotencyKey, transactionContext.traceId]
      );
    });

    it.each([0, -5, 2.5])('rejects invalid withdrawal amount %s', async (amount) => {
      await expect(withdrawal('1', amount, transactionContext)).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('rejects withdrawals greater than $200', async () => {
      await expect(withdrawal('1', 205, transactionContext)).rejects.toMatchObject({
        code: 'WITHDRAWAL_LIMIT_EXCEEDED',
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('rejects amounts that cannot be dispensed in $5 bills', async () => {
      await expect(withdrawal('1', 42, transactionContext)).rejects.toMatchObject({
        code: 'INVALID_DENOMINATION',
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it.each(['checking', 'savings'])('allows a %s account to withdraw its full balance within the other transaction limits', async (type) => {
      const account = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 200,
        type,
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [account] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await withdrawal('1', 200, transactionContext);

      expect(result.amount).toBe(0);
      expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), [0, '1']);
    });

    it.each(['checking', 'savings'])('rejects a %s account overdraft when the amount fits the other transaction rules', async (type) => {
      const account = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 99,
        type,
        credit_limit: null,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [account],
      });

      await expect(withdrawal('1', 100, transactionContext)).rejects.toMatchObject({
        code: 'INSUFFICIENT_FUNDS',
      });
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('allows a credit withdrawal up to the remaining credit limit', async () => {
      const creditAccount = {
        account_number: '3',
        name: 'Jill Credit',
        amount: -800,
        type: 'credit',
        credit_limit: 1000,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [creditAccount] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await withdrawal('3', 200, transactionContext);

      expect(result.amount).toBe(-1000);
      expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), [-1000, '3']);
    });

    it('rejects a withdrawal that would exceed the $400 UTC daily limit', async () => {
      const account = {
        account_number: '1',
        name: 'Jane Doe',
        amount: 1000,
        type: 'checking',
        credit_limit: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [account] })
        .mockResolvedValueOnce({ rows: [{ total: '350' }] });

      await expect(withdrawal('1', 55, transactionContext)).rejects.toMatchObject({
        code: 'DAILY_WITHDRAWAL_LIMIT_EXCEEDED',
        message: 'Withdrawals cannot exceed $400 per UTC calendar day',
      });
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('rejects a withdrawal beyond the remaining credit limit', async () => {
      const creditAccount = {
        account_number: '3',
        name: 'Jill Credit',
        amount: -850,
        type: 'credit',
        credit_limit: 1000,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [creditAccount],
      });

      await expect(withdrawal('3', 200, transactionContext)).rejects.toMatchObject({
        code: 'CREDIT_LIMIT_EXCEEDED',
      });
      expect(db.query).toHaveBeenCalledTimes(1);
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
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rowCount: 0 });

      await expect(withdrawal('1', 200, transactionContext)).rejects.toEqual(
        expect.any(TransactionError)
      );
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
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE query
        .mockResolvedValueOnce({ rowCount: 1 }); // journal INSERT

      const result = await deposit('1', 300, transactionContext);

      expect(result.amount).toBe(1300);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [1300, '1']);
      expect(db.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO transactions'),
        ['1', 'deposit', 300, 1000, 1300, transactionContext.idempotencyKey, transactionContext.traceId]
      );
    });

    it.each([0, -1, 1.5])('rejects invalid deposit amount %s', async (amount) => {
      await expect(deposit('1', amount, transactionContext)).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('rejects deposits greater than $1000', async () => {
      await expect(deposit('1', 1001, transactionContext)).rejects.toMatchObject({
        code: 'DEPOSIT_LIMIT_EXCEEDED',
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('allows a credit account deposit that brings its balance to zero', async () => {
      const creditAccount = {
        account_number: '3',
        name: 'Jill Credit',
        amount: -300,
        type: 'credit',
        credit_limit: 1000,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1, rows: [creditAccount] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await deposit('3', 300, transactionContext);

      expect(result.amount).toBe(0);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [0, '3']);
    });

    it('rejects a credit deposit that would create a positive balance', async () => {
      const creditAccount = {
        account_number: '3',
        name: 'Jill Credit',
        amount: -300,
        type: 'credit',
        credit_limit: 1000,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [creditAccount],
      });

      await expect(deposit('3', 301, transactionContext)).rejects.toMatchObject({
        code: 'CREDIT_OVERPAYMENT',
      });
      expect(db.query).toHaveBeenCalledTimes(1);
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

      await expect(deposit('1', 300, transactionContext)).rejects.toEqual(
        expect.any(TransactionError)
      );
    });
  });
});
