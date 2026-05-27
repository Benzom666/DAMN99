import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section with CTA', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('Delivery Management');
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('displays feature sections', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText(/order management/i)).toBeVisible();
    await expect(page.getByText(/route optimization/i)).toBeVisible();
    await expect(page.getByText(/driver management/i)).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
  });
});
