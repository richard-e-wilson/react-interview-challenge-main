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
  createdAt: string;
}

// Known starter error codes matching baseline application behavior
export type KnownApiErrorCode =
  | 'INVALID_INPUT'
  | 'ACCOUNT_NOT_FOUND'
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
