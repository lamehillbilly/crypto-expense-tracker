-- Drop foreign key constraints first
ALTER TABLE IF EXISTS "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE IF EXISTS "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS "Trade" DROP CONSTRAINT IF EXISTS "Trade_userId_fkey";

-- Drop indices
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";
DROP INDEX IF EXISTS "Account_userId_idx";
DROP INDEX IF EXISTS "Session_sessionToken_key";
DROP INDEX IF EXISTS "Session_userId_idx";
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "VerificationToken_token_key";
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";
DROP INDEX IF EXISTS "Trade_userId_idx";

-- Drop auth-related tables
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "VerificationToken";

-- Remove userId column from Trade table
ALTER TABLE "Trade" DROP COLUMN IF EXISTS "userId";