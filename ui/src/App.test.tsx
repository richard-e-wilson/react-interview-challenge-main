import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { SignIn } from './components/SignIn';
import { apiService } from './services/api';

jest.mock('./services/api');

describe('SignIn Component', () => {
  it('renders sign in header and account number input', () => {
    render(<SignIn signIn={jest.fn()} accountNumberError={false} />);

    expect(screen.getByText(/Please Sign in with your Account Number:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('calls signIn handler with parsed account number when button is clicked', () => {
    const mockSignIn = jest.fn();
    render(<SignIn signIn={mockSignIn} accountNumberError={false} />);

    const input = screen.getByLabelText(/Account Number/i);
    fireEvent.change(input, { target: { value: '123' } });

    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);

    expect(mockSignIn).toHaveBeenCalledWith(123);
  });
});

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  it('renders SignIn by default', () => {
    render(<App />);
    expect(screen.getByText(/Please Sign in with your Account Number:/i)).toBeInTheDocument();
  });

  it('signs in successfully and renders AccountDashboard', async () => {
    (apiService.getAccount as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        accountNumber: 1,
        name: 'John Doe',
        amount: 500,
        type: 'checking',
        creditLimit: null,
      },
    });

    render(<App />);

    const input = screen.getByLabelText(/Account Number/i);
    fireEvent.change(input, { target: { value: '1' } });

    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Hello, John Doe!')).toBeInTheDocument();
    });
  });

  it('alerts and stays on SignIn when account is not found', async () => {
    (apiService.getAccount as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
      },
    });

    render(<App />);

    const input = screen.getByLabelText(/Account Number/i);
    fireEvent.change(input, { target: { value: '999' } });

    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Account not found');
    });

    expect(screen.getByText(/Please Sign in with your Account Number:/i)).toBeInTheDocument();
  });
});
