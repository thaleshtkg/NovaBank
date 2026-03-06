import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Payees from '@/pages/Payees';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockToastFns = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToastFns }));

const mockPayees = [
  { id: 1, name: 'Jane Smith', account_number: '2000000002', bank_name: 'NovaBank', routing_number: '021000021', nickname: 'Jane' },
  { id: 2, name: 'Alice Johnson', account_number: '3000000001', bank_name: 'Chase Bank', routing_number: '021000089', nickname: null },
];

function renderPayees() {
  return render(
    <MemoryRouter>
      <Payees />
    </MemoryRouter>
  );
}

describe('Payees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { payees: mockPayees } });
  });

  it('renders the Payees heading', () => {
    renderPayees();
    expect(screen.getByText('Payees')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderPayees();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders payee cards after loading', async () => {
    renderPayees();
    await waitFor(() => {
      expect(screen.getByTestId('payee-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders nickname for payees that have one', async () => {
    renderPayees();
    await waitFor(() => {
      expect(screen.getByText('(Jane)')).toBeInTheDocument();
    });
  });

  it('renders bank and account info for each payee', async () => {
    renderPayees();
    await waitFor(() => {
      expect(screen.getByText('NovaBank')).toBeInTheDocument();
    });
    expect(screen.getByText('2000000002')).toBeInTheDocument();
  });

  it('shows "No payees found" message when list is empty', async () => {
    api.get.mockResolvedValue({ data: { payees: [] } });
    renderPayees();
    await waitFor(() => {
      expect(screen.getByText(/No payees found/)).toBeInTheDocument();
    });
  });

  it('renders Add Payee button', () => {
    renderPayees();
    expect(screen.getByTestId('add-payee-button')).toBeInTheDocument();
  });

  it('opens add payee modal when Add Payee is clicked', async () => {
    const user = userEvent.setup();
    renderPayees();
    await waitFor(() => {
      expect(screen.getByTestId('add-payee-button')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('add-payee-button'));
    expect(screen.getByText('Add New Payee')).toBeInTheDocument();
    expect(screen.getByTestId('payee-name')).toBeInTheDocument();
    expect(screen.getByTestId('payee-account')).toBeInTheDocument();
    expect(screen.getByTestId('payee-bank')).toBeInTheDocument();
  });

  it('submitting the add payee form calls the API', async () => {
    api.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderPayees();
    await waitFor(() => {
      expect(screen.getByTestId('add-payee-button')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('add-payee-button'));
    await user.type(screen.getByTestId('payee-name'), 'Bob Brown');
    await user.type(screen.getByTestId('payee-account'), '4000000001');
    await user.type(screen.getByTestId('payee-bank'), 'Wells Fargo');
    await user.type(screen.getByTestId('payee-routing'), '021000099');
    await user.click(screen.getByTestId('payee-submit'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/payees', expect.objectContaining({ name: 'Bob Brown' }));
    });
  });

  it('shows delete confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderPayees();
    await waitFor(() => {
      expect(screen.getByTestId('delete-payee-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('delete-payee-1'));
    expect(screen.getByText(/Remove Payee/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-payee')).toBeInTheDocument();
  });

  it('calls delete API when confirm delete is clicked', async () => {
    api.delete.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderPayees();
    await waitFor(() => {
      expect(screen.getByTestId('delete-payee-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('delete-payee-1'));
    await user.click(screen.getByTestId('confirm-delete-payee'));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/payees/1');
    });
  });

  it('renders search input', () => {
    renderPayees();
    expect(screen.getByTestId('payee-search')).toBeInTheDocument();
  });
});
