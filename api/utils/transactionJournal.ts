import { TransactionType } from '../types';
import { query, QueryExecutor } from './db';

interface TransactionRecord {
  accountID: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string;
  traceId: string;
}

export const getDailyWithdrawalTotal = async (
  accountID: string,
  executeQuery: QueryExecutor = query
): Promise<number> => {
  const result = await executeQuery(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE account_number = $1
      AND type = 'withdrawal'
      AND created_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      AND created_at < (date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '1 day') AT TIME ZONE 'UTC'`,
    [accountID]
  );

  return Number(result.rows[0]?.total ?? 0);
};

export const recordTransaction = async (
  transaction: TransactionRecord,
  executeQuery: QueryExecutor = query
) => {
  await executeQuery(`
    INSERT INTO transactions (
      account_number,
      type,
      amount,
      balance_before,
      balance_after,
      idempotency_key,
      trace_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      transaction.accountID,
      transaction.type,
      transaction.amount,
      transaction.balanceBefore,
      transaction.balanceAfter,
      transaction.idempotencyKey,
      transaction.traceId,
    ]
  );
};
