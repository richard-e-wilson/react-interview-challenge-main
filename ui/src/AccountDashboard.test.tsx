import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountDashboard } from './components/AccountDashboard';
import { Account } from './types';
import { apiService } from './services/api';

jest.mock('./services/api');

const mockAccount: Account = {
  accountNumber: 1,
  name: 'John Doe',
  amount: 500,
  type: 'checking',
  creditLimit: null,
};

describe('AccountDashboard Component', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders account owner name and balance', () => {
    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    expect(screen.getByText('Hello, John Doe!')).toBeInTheDocument();
    expect(screen.getByText('Balance: $500')).toBeInTheDocument();
  });

  it('calls signOut prop when Sign Out button is clicked', () => {
    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('handles deposit submission and updates balance', async () => {
    (apiService.deposit as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        accountNumber: 1,
        name: 'John Doe',
        amount: 600,
        type: 'checking',
        creditLimit: null,
      },
    });

    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const depositInput = screen.getByLabelText(/Deposit Amount/i);
    fireEvent.change(depositInput, { target: { value: '100' } });

    const depositSubmitBtn = screen.getAllByRole('button', { name: /Submit/i })[0];
    fireEvent.click(depositSubmitBtn);

    expect(apiService.deposit).toHaveBeenCalledWith(1, 100);

    await waitFor(() => {
      expect(screen.getByText('Balance: $600')).toBeInTheDocument();
    });
  });

  it('shows a rejected deposit without changing the account balance', async () => {
    (apiService.deposit as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: {
        code: 'DEPOSIT_LIMIT_EXCEEDED',
        message: 'Deposits cannot exceed $1000',
        traceId: 'deposit-test-trace',
      },
    });

    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const depositInput = screen.getByLabelText(/Deposit Amount/i);
    expect(depositInput).toHaveAttribute('min', '1');
    expect(depositInput).toHaveAttribute('max', '1000');
    expect(depositInput).toHaveAttribute('step', '1');
    fireEvent.change(depositInput, { target: { value: '1001' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Submit/i })[0]);

    expect(await screen.findByText('Deposits cannot exceed $1000')).toBeInTheDocument();
    expect(screen.getByText('Balance: $500')).toBeInTheDocument();
  });

  it('handles withdrawal submission and updates balance', async () => {
    (apiService.withdraw as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        accountNumber: 1,
        name: 'John Doe',
        amount: 450,
        type: 'checking',
        creditLimit: null,
      },
    });

    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const withdrawInput = screen.getByLabelText(/Withdraw Amount/i);
    fireEvent.change(withdrawInput, { target: { value: '50' } });

    const withdrawSubmitBtn = screen.getAllByRole('button', { name: /Submit/i })[1];
    fireEvent.click(withdrawSubmitBtn);

    expect(apiService.withdraw).toHaveBeenCalledWith(1, 50);

    await waitFor(() => {
      expect(screen.getByText('Balance: $450')).toBeInTheDocument();
    });
  });
});
