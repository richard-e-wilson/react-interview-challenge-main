import express from "express";
import crypto from "crypto";
import transactionsRouter from "./routes/transactions";
import accountsRouter from "./routes/accounts";

export const app = express();

app.use(express.json());

app.use(function (req, res, next) {
  const traceId = req.header('X-Trace-Id') || crypto.randomUUID();
  res.locals.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
});

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, X-Trace-Id, Idempotency-Key'
  );
  res.header('Access-Control-Expose-Headers', 'X-Trace-Id, Idempotency-Key');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Setup Routes
app.use("/transactions", transactionsRouter);
app.use("/accounts", accountsRouter);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
