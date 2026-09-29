import { useState } from 'react';
import './App.css';
import { Grid } from '@mui/material';
import { SignIn } from './components/SignIn';
import { AccountDashboard } from './components/AccountDashboard';
import { Account } from './types';
import { apiService } from './services/api';

export const App = () => {
  const [accountNumberError, setAccountNumberError] = useState(false);
  const [account, setAccount] = useState<Account | undefined>(undefined);

  const signIn = async (accountNumber: number) => {
    const result = await apiService.getAccount(accountNumber);

    if (!result.success) {
      alert(result.error.message || 'Account not found');
      setAccountNumberError(true);
      setAccount(undefined);
      return;
    }

    setAccountNumberError(false);
    setAccount(result.data);
  };

  const signOut = async () => {
    setAccount(undefined);
  };

  const Page = () => {
    if (account) {
      return <AccountDashboard account={account} signOut={signOut} />;
    } else {
      return <SignIn signIn={signIn} accountNumberError={accountNumberError} />;
    }
  };

  return (
    <div className="app">
      <Grid container>
        <Grid item xs={1} />
        <Grid item xs={10}>
          <Page />
        </Grid>
        <Grid item xs={1} />
      </Grid>
    </div>
  );
};
