import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (
  text: string,
  values: any[] = []
): Promise<pg.QueryResult<any>> => pool.query(text, values);
