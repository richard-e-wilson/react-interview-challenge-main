import pg from 'pg';
import { pool, withTransaction } from './db';

describe('withTransaction', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createClient = () => ({
    query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
    release: jest.fn(),
  });

  it('commits successful operations and releases the client', async () => {
    const client = createClient();
    const connectSpy = jest.spyOn(pool, 'connect') as unknown as jest.Mock;
    connectSpy.mockResolvedValue(client as unknown as pg.PoolClient);

    const result = await withTransaction(async (executeQuery) => {
      await executeQuery('SELECT 1');
      return 'complete';
    });

    expect(result).toBe('complete');
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'SELECT 1', []);
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back failed operations and releases the client', async () => {
    const client = createClient();
    const connectSpy = jest.spyOn(pool, 'connect') as unknown as jest.Mock;
    connectSpy.mockResolvedValue(client as unknown as pg.PoolClient);

    await expect(withTransaction(async () => {
      throw new Error('operation failed');
    })).rejects.toThrow('operation failed');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
