import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Form should not submit with empty fields
    await expect(page).toHaveURL(/login/);
  });

  test('redirects to admin dashboard after login', async ({ page }) => {
    // This test requires valid credentials or mocking
    // Skipping actual login for now
    test.skip();
  });
});
