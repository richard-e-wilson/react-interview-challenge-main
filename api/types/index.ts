export type AccountType = 'checking' | 'savings' | 'credit';

export interface Account {
  accountNumber: number;
  name: string;
  amount: number;
  type: AccountType;
  creditLimit: number | null;
}

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: number;
  accountNumber: number;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string;
  traceId: string;
  createdAt: string;
}

export interface TransactionContext {
  idempotencyKey: string;
  traceId: string;
}

// Known starter error codes matching baseline application behavior
export type KnownApiErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_AMOUNT'
  | 'ACCOUNT_NOT_FOUND'
  | 'DEPOSIT_LIMIT_EXCEEDED'
  | 'CREDIT_OVERPAYMENT'
  | 'WITHDRAWAL_LIMIT_EXCEEDED'
  | 'DAILY_WITHDRAWAL_LIMIT_EXCEEDED'
  | 'INVALID_DENOMINATION'
  | 'INSUFFICIENT_FUNDS'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Extensible type: autocomplete for known codes + forward-compatible for future/unknown codes
export type ApiErrorCode = KnownApiErrorCode | (string & {});

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  traceId?: string;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };
