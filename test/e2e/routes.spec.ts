import { test, expect } from '@playwright/test';

test.describe('Route Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // Skip auth for now - would need to set up test user
    test.skip();
  });

  test('displays routes list', async ({ page }) => {
    await page.goto('/admin/routes');
    
    await expect(page.getByRole('heading', { name: /routes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create route/i })).toBeVisible();
  });

  test('can create optimized route', async ({ page }) => {
    await page.goto('/admin/routes');
    
    await page.getByRole('button', { name: /create route/i }).click();
    
    await expect(page.getByLabel(/route name/i)).toBeVisible();
    await expect(page.getByLabel(/driver/i)).toBeVisible();
    
    await page.getByLabel(/route name/i).fill('Test Route');
    
    // Select orders for route
    await page.getByRole('checkbox').first().check();
    await page.getByRole('checkbox').nth(1).check();
    
    await page.getByRole('button', { name: /optimize/i }).click();
    
    await expect(page.getByText('Test Route')).toBeVisible();
  });

  test('displays route on map', async ({ page }) => {
    await page.goto('/admin/routes');
    
    await page.getByRole('row').first().click();
    
    // Should show map with route
    await expect(page.locator('[data-testid="route-map"]')).toBeVisible();
  });
});
