import { getAccount } from './accountHandler';
import * as db from '../utils/db';

jest.mock('../utils/db');

describe('Account Handler Unit Tests', () => {
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
});
