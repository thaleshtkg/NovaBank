const { test, expect } = require('@playwright/test');
const { resetDatabase, login } = require('./helpers');

test.describe('Authentication', () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test('displays login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'NovaBank' })).toBeVisible();
    await expect(page.getByText('QA Testing Portal').first()).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('shows test credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('test-credentials')).toBeVisible();
    await expect(page.getByTestId('test-cred-john')).toBeVisible();
    await expect(page.getByTestId('test-cred-jane')).toBeVisible();
  });

  test('fills John credentials when clicked', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('test-cred-john').click();
    await expect(page.getByPlaceholder('john@novabank.com')).toHaveValue('john@novabank.com');
    await expect(page.getByPlaceholder('Enter your password')).toHaveValue('Test@1234');
  });

  test('fills Jane credentials when clicked', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('test-cred-jane').click();
    await expect(page.getByPlaceholder('john@novabank.com')).toHaveValue('jane@novabank.com');
    await expect(page.getByPlaceholder('Enter your password')).toHaveValue('Test@1234');
  });

  test('logs in with John credentials', async ({ page }) => {
    await login(page, 'john@novabank.com', 'Test@1234');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('logs in with Jane credentials', async ({ page }) => {
    await login(page, 'jane@novabank.com', 'Test@1234');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('john@novabank.com').fill('wrong@novabank.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText(/Login failed|Invalid email or password/)).toBeVisible({ timeout: 5000 });
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
  });

  test('navigates from login to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Create Account').click();
    await page.waitForURL('**/register');
    await expect(page.getByTestId('register-form')).toBeVisible();
  });

  test('registers a new account', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('E2E Test User');
    await page.getByPlaceholder('you@example.com').fill(`e2e_${Date.now()}@test.com`);
    await page.getByPlaceholder('555-0100').fill('555-9999');
    await page.getByPlaceholder('Min. 6 characters').fill('TestPass123');
    await page.getByPlaceholder('Re-enter password').fill('TestPass123');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('navigates from register to login', async ({ page }) => {
    await page.goto('/register');
    await page.getByText('Sign In').click();
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
