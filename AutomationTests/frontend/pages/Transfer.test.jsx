import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Transfer from '@/pages/Transfer';

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

const mockPayees = [
  { id: 1, name: 'Jane Smith', account_number: '2000000002', bank_name: 'NovaBank', routing_number: '021000021' },
];

function renderTransfer() {
  return render(
    <MemoryRouter>
      <Transfer />
    </MemoryRouter>
  );
}

describe('Transfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { payees: mockPayees } });
  });

  it('renders the Transfer Money heading', () => {
    renderTransfer();
    expect(screen.getByText('Transfer Money')).toBeInTheDocument();
  });

  it('renders three step indicators', () => {
    renderTransfer();
    const steps = screen.getAllByText(/^[123]$/);
    expect(steps).toHaveLength(3);
  });

  it('renders payee selector and amount field in step 1', async () => {
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    expect(screen.getByTestId('transfer-amount')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-description')).toBeInTheDocument();
  });

  it('populates payee dropdown with loaded payees', async () => {
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByText('Jane Smith - NovaBank (2000000002)')).toBeInTheDocument();
    });
  });

  it('shows error toast when no payee is selected and Continue is clicked', async () => {
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-continue')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('transfer-continue'));
    expect(mockToastFns.error).toHaveBeenCalledWith('Select a payee');
  });

  it('shows error toast for invalid amount', async () => {
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.click(screen.getByTestId('transfer-continue'));
    expect(mockToastFns.error).toHaveBeenCalledWith('Enter a valid amount');
  });

  it('shows error toast when amount exceeds $1000', async () => {
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.type(screen.getByTestId('transfer-amount'), '1500');
    await user.click(screen.getByTestId('transfer-continue'));
    expect(mockToastFns.error).toHaveBeenCalledWith('Maximum transfer is $1,000 per transaction');
  });

  it('advances to step 2 with valid inputs', async () => {
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.type(screen.getByTestId('transfer-amount'), '100');
    await user.click(screen.getByTestId('transfer-continue'));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-otp')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Confirm Transfer' })).toBeInTheDocument();
  });

  it('back button in step 2 returns to step 1', async () => {
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.type(screen.getByTestId('transfer-amount'), '100');
    await user.click(screen.getByTestId('transfer-continue'));
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Back'));
    expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
  });

  it('shows step 3 success screen after successful transfer', async () => {
    api.post.mockResolvedValue({
      data: { amount: 100, payee: 'Jane Smith', referenceNumber: 'NB123', newBalance: 999900 },
    });
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.type(screen.getByTestId('transfer-amount'), '100');
    await user.click(screen.getByTestId('transfer-continue'));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-otp')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('transfer-otp'), '123456');
    await user.click(screen.getByTestId('transfer-submit'));
    await waitFor(() => {
      expect(screen.getByText('Transfer Successful!')).toBeInTheDocument();
    });
    expect(screen.getByTestId('transfer-ref').textContent).toBe('NB123');
  });

  it('"Make Another Transfer" resets to step 1', async () => {
    api.post.mockResolvedValue({
      data: { amount: 100, payee: 'Jane Smith', referenceNumber: 'NB123', newBalance: 999900 },
    });
    const user = userEvent.setup();
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('transfer-payee'), '1');
    await user.type(screen.getByTestId('transfer-amount'), '100');
    await user.click(screen.getByTestId('transfer-continue'));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-otp')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('transfer-otp'), '123456');
    await user.click(screen.getByTestId('transfer-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-new')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('transfer-new'));
    expect(screen.getByTestId('transfer-payee')).toBeInTheDocument();
  });
});
