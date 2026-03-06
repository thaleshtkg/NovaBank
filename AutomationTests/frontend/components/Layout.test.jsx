import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import api from '@/api/client';
import Layout from '@/components/Layout';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'John Doe', email: 'john@novabank.com' },
    loading: false,
  })),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    dark: false,
    toggleTheme: vi.fn(),
  })),
}));

vi.mock('@/components/Sidebar', () => ({
  default: ({ isOpen, onClose }) => (
    <aside data-testid="sidebar" data-open={String(isOpen)}>
      <button onClick={onClose} data-testid="close-sidebar">Close</button>
    </aside>
  ),
}));

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div data-testid="outlet-content">Page Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } });
  });

  it('renders the sidebar', () => {
    renderLayout();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders the outlet content', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    });
  });

  it('renders welcome message with user name', () => {
    renderLayout();
    expect(screen.getByText('Welcome back,')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders the theme toggle button', () => {
    renderLayout();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders the notifications bell', () => {
    renderLayout();
    expect(screen.getByTestId('notifications-bell')).toBeInTheDocument();
  });

  it('shows notification dropdown when bell is clicked', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByTestId('notifications-bell'));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows "No notifications" when list is empty', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByTestId('notifications-bell'));
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('shows notification items and unread count badge', async () => {
    api.get.mockResolvedValue({
      data: {
        notifications: [
          { id: 1, title: 'Bill Alert', message: 'Test message', is_read: 0, created_at: '2025-01-01T00:00:00Z' },
        ],
        unreadCount: 1,
      },
    });
    renderLayout();
    await waitFor(() => {
      const badge = document.querySelector('.bg-danger-500');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('1');
    });
  });

  it('renders user avatar initial', () => {
    renderLayout();
    const avatarDivs = document.querySelectorAll('.bg-primary-600.rounded-full');
    const avatarWithJ = Array.from(avatarDivs).find(el => el.textContent.trim() === 'J');
    expect(avatarWithJ).toBeTruthy();
  });

  it('renders mobile menu toggle button', () => {
    renderLayout();
    expect(screen.getByTestId('menu-toggle')).toBeInTheDocument();
  });

  it('fetches notifications on mount', async () => {
    renderLayout();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/notifications');
    });
  });
});
