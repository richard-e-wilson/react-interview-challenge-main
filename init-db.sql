-- CREATE TABLE
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    account_number INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR NOT NULL,
    credit_limit INTEGER
);

ALTER TABLE accounts ADD CONSTRAINT verify_type
CHECK (type IN ('checking', 'savings', 'credit'));

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_number INTEGER NOT NULL REFERENCES accounts(account_number),
    type VARCHAR NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    idempotency_key UUID NOT NULL,
    trace_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (account_number, idempotency_key)
);

CREATE INDEX transactions_account_type_created_at_idx
ON transactions (account_number, type, created_at);

-- LOAD DATAS
INSERT INTO accounts 
    (account_number, name, amount, type)
VALUES
    (1, 'Johns Checking', 1000, 'checking'),
    (2, 'Janes Savings', 2000, 'savings'),
    (4, 'Bobs Checking', 40000, 'checking'),
    (5, 'Bills Savings', 50000, 'savings'),
    (7, 'Nancy Checking', 70000, 'checking'),
    (8, 'Nancy Savings', 80000, 'savings');

INSERT INTO accounts
    (account_number, name, amount, type, credit_limit)
VALUES
    (3, 'Jills Credit', -3000, 'credit', 10000),
    (6, 'Bills Credit', -60000, 'credit', 60000),
    (9, 'Nancy Credit', -90000, 'credit', 100000);
