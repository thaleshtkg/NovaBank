const { test, expect } = require('@playwright/test');
const { resetDatabase, login } = require('./helpers');

test.describe('Dashboard', () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays dashboard after login', async ({ page }) => {
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText("Here's your financial overview")).toBeVisible();
  });

  test('shows balance card', async ({ page }) => {
    await expect(page.getByTestId('balance-amount')).toBeVisible();
    const balanceText = await page.getByTestId('balance-amount').textContent();
    expect(balanceText).toContain('$');
  });

  test('shows account number', async ({ page }) => {
    await expect(page.getByText('2000000001')).toBeVisible();
  });

  test('shows income and spending summary', async ({ page }) => {
    await expect(page.getByTestId('total-credit')).toBeVisible();
    await expect(page.getByTestId('total-debit')).toBeVisible();
  });

  test('shows quick action buttons', async ({ page }) => {
    await expect(page.getByTestId('dashboard').getByRole('link', { name: 'Transfer' })).toBeVisible();
    await expect(page.getByTestId('dashboard').getByText('Pay Bills')).toBeVisible();
    await expect(page.getByTestId('dashboard').getByText('Fixed Deposit')).toBeVisible();
    await expect(page.getByTestId('dashboard').getByText('History')).toBeVisible();
  });

  test('shows recent transactions section', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();
    await expect(page.getByText('View All')).toBeVisible();
  });

  test('shows spending by category section', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });
});
