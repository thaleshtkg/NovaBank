import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function TestConsumer() {
  const { dark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-status">{dark ? 'dark' : 'light'}</span>
      <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('defaults to light theme', () => {
    render(
      <ThemeProvider><TestConsumer /></ThemeProvider>
    );
    expect(screen.getByTestId('theme-status').textContent).toBe('light');
  });

  test('toggles to dark theme', () => {
    render(
      <ThemeProvider><TestConsumer /></ThemeProvider>
    );
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme-status').textContent).toBe('dark');
  });

  test('toggles back to light', () => {
    render(
      <ThemeProvider><TestConsumer /></ThemeProvider>
    );
    fireEvent.click(screen.getByTestId('toggle'));
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme-status').textContent).toBe('light');
  });

  test('persists theme to localStorage', () => {
    render(
      <ThemeProvider><TestConsumer /></ThemeProvider>
    );
    fireEvent.click(screen.getByTestId('toggle'));
    expect(localStorage.setItem).toHaveBeenCalledWith('novabank_theme', 'dark');
  });

  test('reads initial theme from localStorage', () => {
    localStorage.getItem.mockReturnValueOnce('dark');
    render(
      <ThemeProvider><TestConsumer /></ThemeProvider>
    );
    expect(screen.getByTestId('theme-status').textContent).toBe('dark');
  });
});
