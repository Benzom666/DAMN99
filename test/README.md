# Testing Guide

This project uses **Vitest** for unit and integration tests, and **Playwright** for E2E tests.

## Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run E2E tests only
pnpm test:e2e

# Run all tests (CI mode)
pnpm test:ci
```

## Test Structure

```
test/
├── unit/                    # Unit tests for business logic
│   ├── authorization.test.ts
│   ├── cost-control.test.ts
│   └── route-optimization.test.ts
├── integration/             # Integration tests for API routes
│   ├── geocode-api.test.ts
│   └── optimize-route-api.test.ts
├── e2e/                     # End-to-end tests with Playwright
│   ├── landing.spec.ts
│   ├── auth.spec.ts
│   ├── orders.spec.ts
│   └── routes.spec.ts
├── mocks.ts                 # Mock factories
└── setup.ts                 # Test setup and configuration
```

## Unit Tests

Unit tests focus on isolated business logic:
- Authorization rules
- Cost control utilities
- Route optimization validation
- Data transformations

## Integration Tests

Integration tests verify API endpoints:
- Request validation
- Error handling
- Response formats
- Rate limiting

## E2E Tests

E2E tests verify complete user workflows:
- Landing page navigation
- Authentication flow
- Order management
- Route optimization

**Note:** Some E2E tests are currently skipped and require authentication setup.

## CI/CD

Tests run automatically on:
- Push to `main` branch
- Pull requests

See `.github/workflows/test.yml` for CI configuration.

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('does something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/admin');
});
```

## Coverage

To generate coverage reports:

```bash
npx vitest run --coverage
```
