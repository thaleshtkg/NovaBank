import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Dashboard from '@/pages/Dashboard';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'John Doe', email: 'john@novabank.com', balance: 1000000 },
    loading: false,
    refreshUser: vi.fn(),
  })),
}));

vi.mock('@/components/SpendingChart', () => ({
  default: ({ categories }) => (
    <div data-testid="spending-chart">{categories?.length ? 'chart' : 'no-data'}</div>
  ),
}));

const mockBalance = { balance: 1000000, accountNumber: '2000000001' };
const mockTransactions = {
  transactions: [
    { id: 1, type: 'credit', amount: 500, description: 'Salary', created_at: '2025-01-01T00:00:00Z' },
    { id: 2, type: 'debit', amount: 100, description: 'Wire Payment', created_at: '2025-01-02T00:00:00Z' },
  ],
};
const mockSummary = {
  totalCredit: 500,
  totalDebit: 100,
  categories: [{ category: 'income', total: 500 }],
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/account/balance') return Promise.resolve({ data: mockBalance });
      if (url === '/transactions/recent') return Promise.resolve({ data: mockTransactions });
      if (url === '/transactions/summary') return Promise.resolve({ data: mockSummary });
      return Promise.reject(new Error(`unknown: ${url}`));
    });
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders the balance amount after loading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('balance-amount')).toBeInTheDocument();
    });
    expect(screen.getByTestId('balance-amount').textContent).toContain('1,000,000.00');
  });

  it('renders total income and total spent', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('total-credit')).toBeInTheDocument();
    });
    expect(screen.getByTestId('total-credit').textContent).toContain('500.00');
    expect(screen.getByTestId('total-debit').textContent).toContain('100.00');
  });

  it('renders recent transactions list', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Wire Payment')).toBeInTheDocument();
  });

  it('shows "No transactions yet" when transaction list is empty', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/account/balance') return Promise.resolve({ data: mockBalance });
      if (url === '/transactions/recent') return Promise.resolve({ data: { transactions: [] } });
      if (url === '/transactions/summary') return Promise.resolve({ data: mockSummary });
      return Promise.reject(new Error());
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
  });

  it('renders all four quick action links', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Pay Bills')).toBeInTheDocument();
    });
    expect(screen.getByText('Fixed Deposit')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    const transferLink = screen.getByRole('link', { name: /transfer/i });
    expect(transferLink).toHaveAttribute('href', '/transfer');
  });

  it('renders "View All" link to transactions', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument();
    });
    expect(screen.getByText('View All').closest('a')).toHaveAttribute('href', '/transactions');
  });

  it('renders spending chart section', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Spending by Category')).toBeInTheDocument();
    });
    expect(screen.getByTestId('spending-chart')).toBeInTheDocument();
  });
});
