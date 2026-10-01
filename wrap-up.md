## Questions

## 1. What issues, if any, did you find with the existing code?

- **Logon is entirely too simple:**   
  Authentication is just entering an account number without any PIN, password, or tokens. Fine for a small demo, but glaringly insecure for production.

- **No Database Connection Pool:**
  API's database interactions create a new connection per query, which causes overhead, poor performance & potential issues at large scales.

- **Missing Database Transactions:**
  API database interactions lack transaction wrapping which permits lost updates and violates correctness for financial app.

- **Poor UI Error Handling & State Corruption:**
  Application error handling is fragile. Database query failures (e.g. attempting very large negative withdrawals that exceed SQL integer numeric range limits) causes the React UI state to clear/corrupt account details (user name and account information fail to load/render properly).

- **No Centralized API Service Layer in UI:**
  The frontend components invoke `fetch` directly with hardcoded API URLs rather than using a centralized API client module/service layer.

- **Inconsistent API Error Formats:**
  API returns plain text for schema validation errors, but JSON objects `{ "error": "..." }` for backend exceptions.

## 2. What issues, if any, did you find with the request to add functionality?

- **Database Schema Changes Required:** 
  Enforcing the $400/day withdrawal limit requires tracking individual transaction history (timestamps, amounts, and account IDs). The existing schema only holds a single point-in-time balance, so implementing this feature necessitated adding a `transactions` table rather than just updating API or UI validation.

- **Ambiguity – Definition of "a single day":**
  The requirement does not specify what constitutes a "day" (e.g., UTC calendar day, bank/server local calendar day, ATM location timezone, or a rolling 24-hour window). *(ASSUMPTION: Implemented using UTC calendar day (`CURRENT_DATE` in SQL / UTC midnight bounds)).*

- **Ambiguity – Scope of "Customer" vs. "Account":**
  The requirement states a *"customer"* can withdraw no more than $400/day, but the app operates purely on *account numbers*. It is unclear whether the $400 limit applies per account or in aggregate across all accounts owned by a single customer (e.g. John's Checking and John's Savings). *(ASSUMPTION: Implemented as a per-account limit).*

## 3. Would you modify the structure of this project if you were to start it over? If so, how?
  Depends on what 'start over' really means. If purely restarting the challenge, there's nothing I'd really change. If it's to rebuild the challenge as a recruiting tool then there are a few fiddly bits I'd consider changing, particulary around it being started with an older Node.js version and Docker version. I'd consider whether those details mattered. Personally, I'd lean towards updating, unless we're specifically looking for a reaction to those details.

## 4. Were there any pieces of this project that you were not able to complete that you'd like to mention?

All major points were completed, but if this were to really be used in a production setting I'd want to flesh out deeper tests around the correctness and performance aspects (db transactions, connection pools, etc.)

## 5. If you were to continue building this out, what would you like to add next?

The correctness test mentioned above are a high priority, but more importantly the login path using account numbers would really need to change to something more realistic.

## 6. If you have any other comments or info you'd like the reviewers to know, please add them below.

Thank you for your time both in reviewing and in the original creation of this challenge. I appreciate that it was more substantial than a single LeetCode challenge, but also not a week's worth of work to complete.