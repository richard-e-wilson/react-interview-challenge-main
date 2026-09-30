import { Account, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'CRITICAL CONFIGURATION ERROR: process.env.REACT_APP_API_URL is not defined. ' +
    'The API service requires REACT_APP_API_URL to be explicitly configured.'
  );
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      if (payload && payload.error) {
        return {
          success: false,
          error: {
            code: payload.error.code || 'UNKNOWN_ERROR',
            message: payload.error.message || 'An error occurred',
            traceId: payload.error.traceId,
          },
        };
      }
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: payload?.message || response.statusText || 'Network request failed',
        },
      };
    }

    return {
      success: true,
      data: payload as T,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unable to connect to server',
      },
    };
  }
}

export const apiService = {
  async getAccount(accountNumber: number): Promise<ApiResponse<Account>> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountNumber}`, {
      headers: {
        'X-Trace-Id': crypto.randomUUID(),
      },
    });
    const result = await handleResponse<{
      account_number: number;
      name: string;
      amount: number;
      type: 'checking' | 'savings' | 'credit';
      credit_limit: number | null;
    }>(response);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        accountNumber: result.data.account_number,
        name: result.data.name,
        amount: result.data.amount,
        type: result.data.type,
        creditLimit: result.data.credit_limit,
      },
    };
  },

  async deposit(accountNumber: number, amount: number): Promise<ApiResponse<Account>> {
    const response = await fetch(`${API_BASE_URL}/transactions/${accountNumber}/deposit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': crypto.randomUUID(),
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ amount }),
    });

    const result = await handleResponse<{
      account_number: number;
      name: string;
      amount: number;
      type: 'checking' | 'savings' | 'credit';
      credit_limit: number | null;
    }>(response);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        accountNumber: result.data.account_number,
        name: result.data.name,
        amount: result.data.amount,
        type: result.data.type,
        creditLimit: result.data.credit_limit,
      },
    };
  },

  async withdraw(accountNumber: number, amount: number): Promise<ApiResponse<Account>> {
    const response = await fetch(`${API_BASE_URL}/transactions/${accountNumber}/withdraw`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': crypto.randomUUID(),
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ amount }),
    });

    const result = await handleResponse<{
      account_number: number;
      name: string;
      amount: number;
      type: 'checking' | 'savings' | 'credit';
      credit_limit: number | null;
    }>(response);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        accountNumber: result.data.account_number,
        name: result.data.name,
        amount: result.data.amount,
        type: result.data.type,
        creditLimit: result.data.credit_limit,
      },
    };
  },
};
