import React, { useState } from "react";
import { Account, ApiError } from "../types";
import { Button, Card, CardContent, Grid, Paper, TextField, Alert } from "@mui/material";
import { apiService } from "../services/api";

type AccountDashboardProps = {
  account: Account;
  signOut: () => Promise<void>;
};

export const AccountDashboard = (props: AccountDashboardProps) => {
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [account, setAccount] = useState<Account>(props.account);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signOut } = props;

  const depositFunds = async () => {
    setErrorMessage(null);
    const result = await apiService.deposit(account.accountNumber, depositAmount);
    if (result.success) {
      setAccount(result.data);
    } else {
      setErrorMessage(result.error.message);
    }
  };

  const withdrawFunds = async () => {
    setErrorMessage(null);
    const result = await apiService.withdraw(account.accountNumber, withdrawAmount);
    if (result.success) {
      setAccount(result.data);
    } else {
      setErrorMessage(result.error.message);
    }
  };

  return (
    <Paper className="account-dashboard">
      <div className="dashboard-header">
        <h1>Hello, {account.name}!</h1>
        <Button variant="contained" onClick={signOut}>Sign Out</Button>
      </div>

      {errorMessage && (
        <Alert severity="error" sx={{ margin: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <h2>Balance: ${account.amount}</h2>
      <Grid container spacing={2} padding={2}>
        <Grid item xs={6}>
          <Card className="deposit-card">
            <CardContent>
              <h3>Deposit</h3>
              <TextField 
                label="Deposit Amount" 
                variant="outlined" 
                type="number"
                sx={{
                  display: 'flex',
                  margin: 'auto',
                }}
                onChange={(e) => setDepositAmount(+e.target.value)}
              />
              <Button 
                variant="contained" 
                sx={{
                  display: 'flex', 
                  margin: 'auto', 
                  marginTop: 2}}
                onClick={depositFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card className="withdraw-card">
            <CardContent>
              <h3>Withdraw</h3>
              <TextField 
                label="Withdraw Amount" 
                variant="outlined" 
                type="number" 
                sx={{
                  display: 'flex',
                  margin: 'auto',
                }}
                onChange={(e) => setWithdrawAmount(+e.target.value)}
              />
              <Button 
                variant="contained" 
                sx={{
                  display: 'flex', 
                  margin: 'auto', 
                  marginTop: 2
                }}
                onClick={withdrawFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};
