import { query } from "../utils/db";
import { TransactionError } from "../utils/errors";
import { TransactionContext } from "../types";
import { recordTransaction } from "../utils/transactionJournal";
import { getAccount } from "./accountHandler";

const MAX_DEPOSIT_AMOUNT = 1000;
const MAX_WITHDRAWAL_AMOUNT = 200;

export const withdrawal = async (
  accountID: string,
  amount: number,
  context: TransactionContext
) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TransactionError(
      "INVALID_AMOUNT",
      "Withdrawal amount must be a positive whole-dollar amount"
    );
  }

  if (amount > MAX_WITHDRAWAL_AMOUNT) {
    throw new TransactionError(
      "WITHDRAWAL_LIMIT_EXCEEDED",
      "Withdrawals cannot exceed $200"
    );
  }

  if (amount % 5 !== 0) {
    throw new TransactionError(
      "INVALID_DENOMINATION",
      "Withdrawal amount must be divisible by $5"
    );
  }

  const account = await getAccount(accountID);
  const balanceBefore = account.amount;
  const updatedAmount = account.amount - amount;

  if (account.type === "credit") {
    const creditLimit = account.credit_limit ?? 0;

    if (updatedAmount < -creditLimit) {
      throw new TransactionError(
        "CREDIT_LIMIT_EXCEEDED",
        "Withdrawal would exceed the account credit limit"
      );
    }
  } else if (updatedAmount < 0) {
    throw new TransactionError(
      "INSUFFICIENT_FUNDS",
      "Withdrawal amount exceeds the available balance"
    );
  }

  account.amount = updatedAmount;
  const res = await query(`
    UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [account.amount, accountID]
  );

  if (res.rowCount === 0) {
    throw new TransactionError("TRANSACTION_FAILED", "Transaction failed");
  }

  await recordTransaction({
    accountID,
    type: "withdrawal",
    amount,
    balanceBefore,
    balanceAfter: updatedAmount,
    ...context,
  });

  return account;
}

export const deposit = async (
  accountID: string,
  amount: number,
  context: TransactionContext
) => {
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
  const balanceBefore = account.amount;

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

  await recordTransaction({
    accountID,
    type: "deposit",
    amount,
    balanceBefore,
    balanceAfter: account.amount,
    ...context,
  });

  return account;
}
