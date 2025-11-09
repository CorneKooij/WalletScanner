# Cardano Wallet Tracker

A web application for tracking Cardano wallet details, token holdings, and transactions.

## Features

- View wallet balance and token holdings
- Track transaction history
- Monitor ADA price and token values in USD
- Search by wallet address

## Prerequisites

- Node.js 16+
- A Blockfrost API key (get one at https://blockfrost.io/)

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd CardanoWalletTracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   BLOCKFROST_API_KEY=your_blockfrost_api_key_here
   PORT=5000
   ```

## Development

Run the development server:

```bash
npm run dev
```

### Testing

This project uses Vitest + Testing Library for client tests and Supertest for server route validation.

Run the test suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

Tests live alongside source in `client/src/__tests__` for UI/utility tests and in `server/__tests__` for API tests. A shared setup file (`test/setup.ts`) registers Testing Library matchers and a `BLOCKFROST_API_KEY` stub is injected for server tests.

If you need to hit live Blockfrost APIs in integration tests, set a real key in your environment before running tests:

```bash
export BLOCKFROST_API_KEY=your_real_key_here
npm test
```

### Adding New Tests

1. For React components, prefer Testing Library and assert on accessible text.
2. For pure functions, add a `.test.ts` file near the module.
3. For new routes, add validation + happy-path tests under `server/__tests__` using Supertest.
4. Keep expectations locale-agnostic when formatting numbers (see `formatUtils.test.ts`).

### Future Improvements

* Add integration tests mocking external API responses.
* Add snapshot tests for complex component states.
* Add E2E tests (Playwright) for critical wallet lookup flow.
```

This will start the server at http://localhost:5000.

## Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Technology Stack

- Frontend: React, TailwindCSS, shadcn/ui
- Backend: Express, Node.js
- API: Blockfrost for Cardano blockchain data
- Build Tools: Vite, esbuild
