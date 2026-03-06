import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Bills from '@/pages/Bills';

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

const futureDue = new Date();
futureDue.setDate(futureDue.getDate() + 10);
const soonDue = new Date();
soonDue.setDate(soonDue.getDate() + 3);

const mockBills = [
  { id: 1, biller_name: 'PowerGrid Co', category: 'electricity', amount: 145.00, status: 'pending', due_date: futureDue.toISOString() },
  { id: 2, biller_name: 'FastNet ISP', category: 'internet', amount: 79.99, status: 'pending', due_date: soonDue.toISOString() },
  { id: 3, biller_name: 'WaterWorks', category: 'water', amount: 55.00, status: 'paid', due_date: futureDue.toISOString(), paid_at: '2025-01-01T00:00:00Z' },
];

function renderBills() {
  return render(
    <MemoryRouter>
      <Bills />
    </MemoryRouter>
  );
}

describe('Bills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { bills: mockBills } });
  });

  it('renders the Bill Payments heading', () => {
    renderBills();
    expect(screen.getByText('Bill Payments')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderBills();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders pending bills section', async () => {
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('pending-bills')).toBeInTheDocument();
    });
    expect(screen.getByText('PowerGrid Co')).toBeInTheDocument();
    expect(screen.getByText('FastNet ISP')).toBeInTheDocument();
  });

  it('renders paid bills section', async () => {
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('paid-bills')).toBeInTheDocument();
    });
    expect(screen.getByText('WaterWorks')).toBeInTheDocument();
  });

  it('displays bill amounts', async () => {
    renderBills();
    await waitFor(() => {
      expect(screen.getByText('$145.00')).toBeInTheDocument();
    });
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('shows "No bills at the moment" when list is empty', async () => {
    api.get.mockResolvedValue({ data: { bills: [] } });
    renderBills();
    await waitFor(() => {
      expect(screen.getByText('No bills at the moment')).toBeInTheDocument();
    });
  });

  it('renders Pay Now button for each pending bill', async () => {
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('pay-bill-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('pay-bill-2')).toBeInTheDocument();
  });

  it('opens payment confirmation modal on Pay Now click', async () => {
    const user = userEvent.setup();
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('pay-bill-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('pay-bill-1'));
    expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-pay-bill')).toBeInTheDocument();
  });

  it('calls pay API when confirm pay is clicked', async () => {
    api.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('pay-bill-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('pay-bill-1'));
    await user.click(screen.getByTestId('confirm-pay-bill'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/bills/1/pay');
    });
  });

  it('shows bill due date', async () => {
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('pending-bills')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Due:/)).toHaveLength(2);
  });

  it('does not render pending section when there are no pending bills', async () => {
    const paidOnly = [mockBills[2]];
    api.get.mockResolvedValue({ data: { bills: paidOnly } });
    renderBills();
    await waitFor(() => {
      expect(screen.getByTestId('paid-bills')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('pending-bills')).not.toBeInTheDocument();
  });
});
