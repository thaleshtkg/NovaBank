import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Transactions from '@/pages/Transactions';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
}));

const mockToastFns = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToastFns }));

const mockTxns = [
  {
    id: 1, type: 'credit', amount: 1000, description: 'Salary', category: 'income',
    reference_number: 'NB001', balance_after: 1001000, created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 2, type: 'debit', amount: 200, description: 'Groceries', category: 'shopping',
    reference_number: 'NB002', balance_after: 999800, created_at: '2025-01-02T11:00:00Z',
  },
];
const mockPagination = { page: 1, totalPages: 1, total: 2 };

function renderTransactions() {
  return render(
    <MemoryRouter>
      <Transactions />
    </MemoryRouter>
  );
}

describe('Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: { transactions: mockTxns, pagination: mockPagination },
    });
  });

  it('renders the Transactions heading', () => {
    renderTransactions();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderTransactions();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders transactions table after loading', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('renders table row for each transaction', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('txn-row-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('txn-row-2')).toBeInTheDocument();
  });

  it('shows total count in subtitle', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByText('2 transactions found')).toBeInTheDocument();
    });
  });

  it('shows "No transactions found" for empty list', async () => {
    api.get.mockResolvedValue({
      data: { transactions: [], pagination: { page: 1, totalPages: 0, total: 0 } },
    });
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  it('clicking "Filters" button toggles the filter panel', async () => {
    const user = userEvent.setup();
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('toggle-filters')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('toggle-filters'));
    expect(screen.getByTestId('filter-search')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type')).toBeInTheDocument();
    expect(screen.getByTestId('filter-category')).toBeInTheDocument();
  });

  it('renders Export CSV button', () => {
    renderTransactions();
    expect(screen.getByTestId('export-csv')).toBeInTheDocument();
  });

  it('renders credit amounts with + prefix', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });
    expect(screen.getByText('+$1,000.00')).toBeInTheDocument();
  });

  it('renders debit amounts with - prefix', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });
    expect(screen.getByText('-$200.00')).toBeInTheDocument();
  });

  it('does not render pagination when only one page', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('prev-page')).not.toBeInTheDocument();
  });

  it('renders pagination controls when more than one page exists', async () => {
    api.get.mockResolvedValue({
      data: {
        transactions: mockTxns,
        pagination: { page: 1, totalPages: 3, total: 30 },
      },
    });
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByTestId('prev-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('next-page')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
