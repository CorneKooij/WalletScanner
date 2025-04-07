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
