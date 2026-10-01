import { query, QueryExecutor } from "../utils/db";

export const getAccount = async (
  accountID: string,
  executeQuery: QueryExecutor = query,
  lockForUpdate = false
) => {
  const res = await executeQuery(`
    SELECT account_number, name, amount, type, credit_limit 
    FROM accounts 
    WHERE account_number = $1
    ${lockForUpdate ? "FOR UPDATE" : ""}`,
    [accountID]
  );

  if (res.rowCount === 0) {
    throw new Error("Account not found");
  }

  return res.rows[0];
};
