# TODO Report: Improving and Enhancing Existing Features and Site Usability

## Introduction

The goal of this report is to outline a structured step-by-step approach to improving and enhancing existing features and site usability.

## Step 1: Review Current Codebase

- Review client-side code in `client/src/`
- Identify areas for improvement in terms of features and usability

## Step 2: Improve Navigation and Routing

- Review current routing implementation in `App.tsx`
- Consider using a more robust routing library like React Router

## Step 3: Enhance User Experience

- Improve responsiveness and accessibility of the application
- Consider adding more interactive elements and feedback mechanisms

## Step 4: Optimize Performance

- Review current performance bottlenecks and areas for optimization
- Consider using caching, code splitting, or other optimization techniques

## Step 5: Improve Security

- Review current security measures and identify areas for improvement
- Consider implementing additional security features like authentication and authorization
- Filter out coins and tokens that are scams or wallet drainers & give users an indication

## Step 6: Add New Features

- Identify new features that can be added to improve site usability and user experience
- Prioritize features based on user needs and business goals

## Step 7: Test and Deploy

- Test all changes thoroughly to ensure they do not introduce new bugs
- Deploy changes to production environment

# WalletScanner TODO

## 🐛 Critical Bugs & Issues

### Database Integration

- [ ] **CRITICAL**: Database is configured but not being used
  - Schema defined in [`shared/schema.ts`](shared/schema.ts) (wallets, tokens, transactions, nfts, balanceHistory)
  - Database connection setup in [`server/db.ts`](server/db.ts)
  - Currently using in-memory storage ([`server/storage.ts`](server/storage.ts))
  - **Action**: Implement proper database persistence using Drizzle ORM

### ADA Handle Support

- [ ] ADA handle resolution partially implemented but not used
  - [`resolveHandle`](server/services/blockfrostService.ts) function exists in blockfrostService
  - Handle resolution not integrated into wallet lookup flow
  - **Action**: Add handle support to wallet input and API endpoints

### Error Handling

- [ ] Inconsistent error handling across API endpoints
  - Some endpoints return generic 500 errors
  - NFT loading errors not gracefully handled in UI
  - **Action**: Implement standardized error responses and user-friendly messages

## 🚀 High Priority Features

### Performance Optimization

- [ ] Implement proper caching strategy
  - Currently using Map-based cache with 5-minute TTL for NFTs
  - No persistent cache for token prices or transaction history
  - **Action**: Implement Redis or similar for distributed caching

### Token Price Accuracy

- [ ] Improve token price calculations
  - Some tokens may not have prices from Muesliswap
  - Decimal handling inconsistencies (see [`formatTokenAmount`](client/src/lib/formatUtils.ts))
  - **Action**: Add fallback price sources (DEX aggregators, CoinGecko)

### Transaction History

- [ ] Enhanced transaction details
  - Currently shows basic transaction info
  - Missing DEX swap details and smart contract interactions
  - **Action**: Parse transaction metadata for better categorization

### NFT Features

- [ ] NFT transaction history not displayed in UI
  - Backend endpoint exists ([`/api/nft/:assetId/transactions`](server/routes.ts))
  - Not consumed by frontend
  - **Action**: Add transaction history to NFT detail modal

## 🎨 UI/UX Improvements

### Loading States

- [ ] Improve progressive loading experience
  - Basic wallet info loads first ✅
  - Transactions and NFTs load in background ✅
  - Need better visual indicators for partial data loading
  - **Action**: Add skeleton loaders for individual sections

### Mobile Responsiveness

- [ ] Enhance mobile layout
  - Dashboard cards need better stacking on mobile
  - Charts may not render well on small screens
  - **Action**: Test and optimize for mobile viewports

### Search History

- [ ] Add recently viewed wallets
  - No persistence of search history
  - **Action**: Store recent addresses in localStorage

## 🔧 Code Quality

### TypeScript

- [ ] Add proper TypeScript types throughout
  - Many `any` types in wallet context ([`WalletContext.tsx`](client/src/contexts/WalletContext.tsx))
  - Missing interfaces for API responses
  - **Action**: Create comprehensive type definitions in `@shared/types`

### Testing

- [x] Initial test setup (Vitest + Testing Library + Supertest)
- [x] Client utility & component smoke tests
- [x] Server route validation tests
- [ ] Integration tests mocking external services (Blockfrost, price feeds)
- [ ] E2E tests (Playwright) for wallet lookup & progressive loading
- [ ] Coverage threshold enforcement & CI integration

### Code Organization

- [ ] Consolidate duplicate code
  - Transaction type rendering duplicated in [`TransactionHistory.tsx`](client/src/components/Dashboard/TransactionHistory.tsx) and [`Transactions.tsx`](client/src/pages/Transactions.tsx)
  - **Action**: Extract shared components and utilities

## 📊 Data & Analytics

### Balance History

- [ ] Implement actual historical balance tracking
  - Currently only shows recent data points
  - No historical snapshots being saved
  - **Action**: Implement daily balance snapshots

### Portfolio Analytics

- [ ] Add portfolio analytics features
  - Token allocation pie chart exists ✅
  - Missing: profit/loss tracking, cost basis, tax reporting
  - **Action**: Add portfolio performance metrics

## 🔐 Security

### API Key Management

- [ ] Secure API key handling
  - Blockfrost API key in environment variables ✅
  - No rate limiting on API endpoints
  - **Action**: Implement rate limiting and request throttling

### Input Validation

- [ ] Strengthen input validation
  - Basic address validation exists ✅
  - Need validation for all user inputs
  - **Action**: Add comprehensive input sanitization

## 📝 Documentation

### API Documentation

- [ ] Document API endpoints
  - Multiple endpoints in [`routes.ts`](server/routes.ts)
  - No OpenAPI/Swagger documentation
  - **Action**: Add API documentation (OpenAPI spec)

### Code Comments

- [ ] Add JSDoc comments
  - Some functions have comments ✅
  - Inconsistent documentation style
  - **Action**: Add JSDoc to all public functions

## 🌟 Nice-to-Have Features

### Advanced Features

- [ ] Wallet comparison (compare multiple wallets side-by-side)
- [ ] Price alerts for tokens
- [ ] Export functionality (CSV, PDF reports)
- [ ] Staking rewards tracking with detailed history
- [ ] Multi-wallet portfolio view
- [ ] Dark mode support

### Integrations

- [ ] Support for multiple explorers (CardanoScan, AdaStat, Pool.pm)
- [ ] DEX integration for direct swaps
- [ ] Wallet connect integration
- [ ] Email/Discord notifications for transactions

## ⚙️ DevOps

### Deployment

- [ ] Set up CI/CD pipeline
- [ ] Configure production build optimization
- [ ] Set up monitoring and logging (Sentry, LogRocket)
- [ ] Database migrations strategy

### Environment

- [ ] Multi-environment configuration (dev, staging, prod)
- [ ] Environment-specific API keys and endpoints
- [ ] Docker containerization

---

## Priority Ranking

1. **P0 (Critical)**: Database integration, Error handling
2. **P1 (High)**: Performance optimization, Token price accuracy, TypeScript types
3. **P2 (Medium)**: UI/UX improvements, Testing, Documentation
4. **P3 (Low)**: Nice-to-have features, Advanced analytics

## Next Steps

1. Fix database integration to enable persistent storage
2. Add comprehensive error handling across the application
3. Implement proper TypeScript types
4. Add unit and integration tests
5. Optimize performance with proper caching
6. Enhance UI/UX with better loading states and mobile support
