async function resetDatabase() {
  const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset database: ${response.status} (target: ${baseUrl})`);
  }
}

async function login(page, email = 'john@novabank.com', password = 'Test@1234') {
  await page.goto('/login');
  await page.getByPlaceholder('john@novabank.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

module.exports = { resetDatabase, login };
