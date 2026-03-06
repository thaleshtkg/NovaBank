import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import FixedDeposits from '@/pages/FixedDeposits';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'John Doe', balance: 1000000 },
    refreshUser: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useOutletContext: vi.fn(() => ({ refreshNotifications: vi.fn() })),
  };
});

const mockToastFns = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToastFns }));

const maturityDate = new Date();
maturityDate.setFullYear(maturityDate.getFullYear() + 1);

const mockFDs = [
  {
    id: 1, amount: 5000, interest_rate: 6.5, tenure_months: 12,
    status: 'active', created_at: '2025-01-01T00:00:00Z',
    maturity_date: maturityDate.toISOString(),
  },
];
const mockInterestRates = { 3: 4.5, 6: 5.5, 12: 6.5, 24: 7.0, 36: 7.5 };

function renderFDs() {
  return render(
    <MemoryRouter>
      <FixedDeposits />
    </MemoryRouter>
  );
}

describe('FixedDeposits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: { fixedDeposits: mockFDs, interestRates: mockInterestRates },
    });
  });

  it('renders the Fixed Deposits heading', () => {
    renderFDs();
    expect(screen.getByText('Fixed Deposits')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderFDs();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders active FDs section', async () => {
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('active-fds')).toBeInTheDocument();
    });
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('renders the interest rate table with all rates', async () => {
    renderFDs();
    await waitFor(() => {
      expect(screen.getByText('4.5%')).toBeInTheDocument();
    });
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    expect(screen.getByText('7%')).toBeInTheDocument();
    expect(screen.getByText('7.5%')).toBeInTheDocument();
  });

  it('renders Create FD button', async () => {
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('create-fd-btn')).toBeInTheDocument();
    });
  });

  it('opens create FD modal when Create FD is clicked', async () => {
    const user = userEvent.setup();
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('create-fd-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('create-fd-btn'));
    expect(screen.getByTestId('fd-amount')).toBeInTheDocument();
    expect(screen.getByTestId('fd-tenure')).toBeInTheDocument();
  });

  it('shows estimated return when amount and tenure are selected', async () => {
    const user = userEvent.setup();
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('create-fd-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('create-fd-btn'));
    await user.type(screen.getByTestId('fd-amount'), '10000');
    await user.selectOptions(screen.getByTestId('fd-tenure'), '12');
    await waitFor(() => {
      expect(screen.getByText(/Estimated returns/)).toBeInTheDocument();
    });
  });

  it('calls API to create FD on submit', async () => {
    api.post.mockResolvedValue({ data: { fixedDeposit: { id: 2, amount: 10000 } } });
    const user = userEvent.setup();
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('create-fd-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('create-fd-btn'));
    await user.type(screen.getByTestId('fd-amount'), '10000');
    await user.selectOptions(screen.getByTestId('fd-tenure'), '12');
    await user.click(screen.getByTestId('fd-submit'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/fixed-deposits', { amount: 10000, tenure_months: 12 });
    });
  });

  it('shows break FD confirmation modal when Break FD is clicked', async () => {
    const user = userEvent.setup();
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('break-fd-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('break-fd-1'));
    expect(screen.getByText('Break Fixed Deposit')).toBeInTheDocument();
    expect(screen.getByText(/1% penalty/)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-break-fd')).toBeInTheDocument();
  });

  it('calls break API when confirm break is clicked', async () => {
    api.post.mockResolvedValue({ data: { totalReturn: 5325, interest: 325 } });
    const user = userEvent.setup();
    renderFDs();
    await waitFor(() => {
      expect(screen.getByTestId('break-fd-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('break-fd-1'));
    await user.click(screen.getByTestId('confirm-break-fd'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/fixed-deposits/1/break');
    });
  });

  it('shows empty state message when no fixed deposits exist', async () => {
    api.get.mockResolvedValue({ data: { fixedDeposits: [], interestRates: mockInterestRates } });
    renderFDs();
    await waitFor(() => {
      expect(screen.getByText(/No fixed deposits yet/i)).toBeInTheDocument();
    });
  });
});
