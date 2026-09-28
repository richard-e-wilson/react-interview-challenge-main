import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountDashboard } from './components/AccountDashboard';

const mockAccount = {
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
    global.fetch = jest.fn();
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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        account_number: 1,
        name: 'John Doe',
        amount: 600,
        type: 'checking',
        credit_limit: null,
      }),
    });

    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const depositInput = screen.getByLabelText(/Deposit Amount/i);
    fireEvent.change(depositInput, { target: { value: '100' } });

    const depositSubmitBtn = screen.getAllByRole('button', { name: /Submit/i })[0];
    fireEvent.click(depositSubmitBtn);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/transactions/1/deposit',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ amount: 100 }),
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Balance: $600')).toBeInTheDocument();
    });
  });

  it('handles withdrawal submission and updates balance', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        account_number: 1,
        name: 'John Doe',
        amount: 450,
        type: 'checking',
        credit_limit: null,
      }),
    });

    render(<AccountDashboard account={mockAccount} signOut={mockSignOut} />);

    const withdrawInput = screen.getByLabelText(/Withdraw Amount/i);
    fireEvent.change(withdrawInput, { target: { value: '50' } });

    const withdrawSubmitBtn = screen.getAllByRole('button', { name: /Submit/i })[1];
    fireEvent.click(withdrawSubmitBtn);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/transactions/1/withdraw',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ amount: 50 }),
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Balance: $450')).toBeInTheDocument();
    });
  });
});
