import pg from 'pg';

export type QueryExecutor = (
  text: string,
  values?: any[]
) => Promise<pg.QueryResult<any>>;

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query: QueryExecutor = (text, values = []) => pool.query(text, values);

export const withTransaction = async <T>(
  operation: (executeQuery: QueryExecutor) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  const executeQuery: QueryExecutor = (text, values = []) => client.query(text, values);

  try {
    await client.query('BEGIN');
    const result = await operation(executeQuery);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
