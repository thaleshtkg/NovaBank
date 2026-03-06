import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '@/api/client';
import Profile from '@/pages/Profile';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'John Doe' },
    refreshUser: vi.fn(),
  })),
}));

const mockToastFns = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToastFns }));

const mockProfile = {
  id: 1, name: 'John Doe', email: 'john@novabank.com', phone: '555-0101',
  account_number: '2000000001', account_type: 'savings', balance: 1000000,
  created_at: '2024-01-01T00:00:00Z',
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  );
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { user: mockProfile } });
  });

  it('shows loading spinner initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderProfile();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders profile page with user name', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-name').textContent).toBe('John Doe');
  });

  it('renders email as read-only', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-email')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-email').textContent).toBe('john@novabank.com');
  });

  it('renders phone number', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-phone')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-phone').textContent).toBe('555-0101');
  });

  it('renders account number', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-account')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-account').textContent).toBe('2000000001');
  });

  it('renders account type capitalised', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-type')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-type').textContent).toBe('Savings');
  });

  it('renders account balance', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-balance')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-balance').textContent).toContain('1,000,000.00');
  });

  it('renders Edit Profile button', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument();
    });
  });

  it('switches to editing mode when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('edit-profile-btn'));
    expect(screen.getByTestId('profile-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('profile-phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-profile-btn')).toBeInTheDocument();
  });

  it('shows error toast when saving with empty name', async () => {
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('edit-profile-btn'));
    await user.clear(screen.getByTestId('profile-name-input'));
    await user.click(screen.getByTestId('save-profile-btn'));
    expect(mockToastFns.error).toHaveBeenCalledWith('Name is required');
  });

  it('calls PUT API on save with valid name', async () => {
    api.put.mockResolvedValue({ data: { user: { ...mockProfile, name: 'John Updated' } } });
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('edit-profile-btn'));
    await user.clear(screen.getByTestId('profile-name-input'));
    await user.type(screen.getByTestId('profile-name-input'), 'John Updated');
    await user.click(screen.getByTestId('save-profile-btn'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/account/profile', expect.objectContaining({ name: 'John Updated' }));
    });
  });
});
