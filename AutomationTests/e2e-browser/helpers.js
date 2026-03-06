async function resetDatabase() {
  const response = await fetch('http://localhost:3000/api/admin/reset', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset database: ${response.status}`);
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
