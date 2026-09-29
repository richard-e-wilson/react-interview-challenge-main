import { query } from "../utils/db";
import { TransactionError } from "../utils/errors";
import { getAccount } from "./accountHandler";

const MAX_DEPOSIT_AMOUNT = 1000;

export const withdrawal = async (accountID: string, amount: number) => {
  const account = await getAccount(accountID);
  account.amount -= amount;
  const res = await query(`
    UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [account.amount, accountID]
  );

  if (res.rowCount === 0) {
    throw new Error("Transaction failed");
  }

  return account;
}

export const deposit = async (accountID: string, amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TransactionError(
      "INVALID_AMOUNT",
      "Deposit amount must be a positive whole-dollar amount"
    );
  }

  if (amount > MAX_DEPOSIT_AMOUNT) {
    throw new TransactionError(
      "DEPOSIT_LIMIT_EXCEEDED",
      "Deposits cannot exceed $1000"
    );
  }

  const account = await getAccount(accountID);

  if (account.type === "credit" && account.amount + amount > 0) {
    throw new TransactionError(
      "CREDIT_OVERPAYMENT",
      "Deposit cannot exceed the outstanding credit balance"
    );
  }

  account.amount += amount;
  const res = await query(`
    UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [account.amount, accountID]
  );

  if (res.rowCount === 0) {
    throw new TransactionError("TRANSACTION_FAILED", "Transaction failed");
  }

  return account;
}
