const { test, expect } = require('@playwright/test');
const { resetDatabase, login } = require('./helpers');

test.describe('E2E Smoke Tests', () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test('app loads and shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/NovaBank/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('complete login flow', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('balance-amount')).toBeVisible();
  });

  test('navigation works across pages', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-transfer').click();
    await page.waitForURL('**/transfer');
    await page.getByTestId('nav-dashboard').click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('logout and re-login works', async ({ page }) => {
    await login(page);
    await page.getByTestId('logout-button').click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await login(page);
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('register new user and access dashboard', async ({ page }) => {
    await page.goto('/register');
    const ts = Date.now();
    await page.getByPlaceholder('John Doe').fill('Smoke E2E');
    await page.getByPlaceholder('you@example.com').fill(`smoke_e2e_${ts}@test.com`);
    await page.getByPlaceholder('555-0100').fill('555-0001');
    await page.getByPlaceholder('Min. 6 characters').fill('SmokeTest123');
    await page.getByPlaceholder('Re-enter password').fill('SmokeTest123');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });
});
