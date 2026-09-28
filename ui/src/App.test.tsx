import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { SignIn } from './components/SignIn';

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
    global.fetch = jest.fn();
    global.alert = jest.fn();
  });

  it('renders SignIn by default', () => {
    render(<App />);
    expect(screen.getByText(/Please Sign in with your Account Number:/i)).toBeInTheDocument();
  });

  it('signs in successfully and renders AccountDashboard', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        account_number: 1,
        name: 'John Doe',
        amount: 500,
        type: 'checking',
        credit_limit: null,
      }),
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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 404,
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
