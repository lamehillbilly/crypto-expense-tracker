-- CreateTable
CREATE TABLE "Entry" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "txn" TEXT,
    "tokenName" TEXT,
    "purchaseAmount" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "status" TEXT,
    "closeAmount" DOUBLE PRECISION,
    "closeDate" TIMESTAMP(3),
    "pnl" DOUBLE PRECISION,
    "daysHeld" INTEGER,
    "expenseDetails" JSONB,
    "claimDetails" JSONB,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "tokenName" TEXT NOT NULL,
    "purchaseAmount" DOUBLE PRECISION NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "closeAmount" DOUBLE PRECISION,
    "closeDate" TIMESTAMP(3),
    "pnl" DOUBLE PRECISION,
    "daysHeld" INTEGER,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

