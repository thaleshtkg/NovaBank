const { test, expect } = require('@playwright/test');
const { resetDatabase, login } = require('./helpers');

test.describe('Navigation & Layout', () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('sidebar-nav')).toBeVisible();
  });

  test('sidebar contains all nav links', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-transfer')).toBeVisible();
    await expect(page.getByTestId('nav-payees')).toBeVisible();
    await expect(page.getByTestId('nav-transactions')).toBeVisible();
    await expect(page.getByTestId('nav-bills')).toBeVisible();
    await expect(page.getByTestId('nav-fixed-deposits')).toBeVisible();
    await expect(page.getByTestId('nav-profile')).toBeVisible();
  });

  test('navigates to Transfer page', async ({ page }) => {
    await page.getByTestId('nav-transfer').click();
    await page.waitForURL('**/transfer');
    await expect(page.getByRole('heading', { name: 'Transfer Money' })).toBeVisible();
  });

  test('navigates to Payees page', async ({ page }) => {
    await page.getByTestId('nav-payees').click();
    await page.waitForURL('**/payees');
    await expect(page.getByRole('heading', { name: 'Payees' })).toBeVisible();
  });

  test('navigates to Transactions page', async ({ page }) => {
    await page.getByTestId('nav-transactions').click();
    await page.waitForURL('**/transactions');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
  });

  test('navigates to Bills page', async ({ page }) => {
    await page.getByTestId('nav-bills').click();
    await page.waitForURL('**/bills');
    await expect(page.getByRole('heading', { name: 'Bill Payments' })).toBeVisible();
  });

  test('navigates to Fixed Deposits page', async ({ page }) => {
    await page.getByTestId('nav-fixed-deposits').click();
    await page.waitForURL('**/fixed-deposits');
    await expect(page.getByRole('heading', { name: 'Fixed Deposits' })).toBeVisible();
  });

  test('navigates to Profile page', async ({ page }) => {
    await page.getByTestId('nav-profile').click();
    await page.waitForURL('**/profile');
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
  });

  test('navigates back to Dashboard', async ({ page }) => {
    await page.getByTestId('nav-transfer').click();
    await page.waitForURL('**/transfer');
    await page.getByTestId('nav-dashboard').click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('shows user welcome message', async ({ page }) => {
    await expect(page.getByText('Welcome back,')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('shows logout button', async ({ page }) => {
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('logout returns to login page', async ({ page }) => {
    await page.getByTestId('logout-button').click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('theme toggle is present', async ({ page }) => {
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
  });

  test('theme toggle switches theme', async ({ page }) => {
    await page.getByTestId('theme-toggle').click();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    await page.getByTestId('theme-toggle').click();
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    expect(isLight).toBe(true);
  });

  test('notifications bell is present', async ({ page }) => {
    await expect(page.getByTestId('notifications-bell')).toBeVisible();
  });

  test('clicking notifications bell opens dropdown', async ({ page }) => {
    await page.getByTestId('notifications-bell').click();
    await expect(page.getByText('Notifications')).toBeVisible();
  });
});
