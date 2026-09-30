import { TransactionType } from '../types';
import { query } from './db';

interface TransactionRecord {
  accountID: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string;
  traceId: string;
}

export const recordTransaction = async (transaction: TransactionRecord) => {
  await query(`
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
