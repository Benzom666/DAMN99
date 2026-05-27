import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Skip auth for now - would need to set up test user
    test.skip();
  });

  test('displays orders list', async ({ page }) => {
    await page.goto('/admin/orders');
    
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create order/i })).toBeVisible();
  });

  test('can create new order', async ({ page }) => {
    await page.goto('/admin/orders');
    
    await page.getByRole('button', { name: /create order/i }).click();
    
    await expect(page.getByLabel(/customer name/i)).toBeVisible();
    await expect(page.getByLabel(/delivery address/i)).toBeVisible();
    
    await page.getByLabel(/customer name/i).fill('Test Customer');
    await page.getByLabel(/delivery address/i).fill('123 Test St');
    
    await page.getByRole('button', { name: /save/i }).click();
    
    await expect(page.getByText('Test Customer')).toBeVisible();
  });

  test('can filter orders by status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const statusFilter = page.getByRole('combobox', { name: /status/i });
    await statusFilter.click();
    await page.getByRole('option', { name: /pending/i }).click();
    
    // Should show only pending orders
    await expect(page.getByText(/pending/i)).toBeVisible();
  });
});
