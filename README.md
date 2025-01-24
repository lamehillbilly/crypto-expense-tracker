# Crypto Expense Tracker

A web application for tracking cryptocurrency expenses, trades, and tax obligations.

## Features

- Track expenses, trades, and claims
- Calculate tax obligations
- Generate tax summaries
- Visualize data with charts
- PostgreSQL database with Prisma ORM

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```
Then edit `.env` with your database credentials.

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

## Technologies Used

- Next.js 13+ (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Recharts

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

- `DATABASE_URL`: Your PostgreSQL connection string
- `ADMIN_USERNAME`: Admin login username
- `ADMIN_PASSWORD`: Admin login password
- `JWT_SECRET`: Secret key for JWT tokens

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
