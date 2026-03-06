import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const mockLogout = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'John Doe' },
    logout: mockLogout,
  })),
}));

function renderSidebar(isOpen = false, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <Sidebar isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sidebar element', () => {
    renderSidebar();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders NovaBank branding', () => {
    renderSidebar();
    expect(screen.getByText('NovaBank')).toBeInTheDocument();
    expect(screen.getByText('QA Testing Portal')).toBeInTheDocument();
  });

  it('renders all 7 navigation links', () => {
    renderSidebar();
    const nav = screen.getByTestId('sidebar-nav');
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(7);
  });

  it('renders Dashboard nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders Transfer Money nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-transfer')).toBeInTheDocument();
    expect(screen.getByText('Transfer Money')).toBeInTheDocument();
  });

  it('renders Payees nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-payees')).toBeInTheDocument();
  });

  it('renders Transactions nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-transactions')).toBeInTheDocument();
  });

  it('renders Bill Payments nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-bills')).toBeInTheDocument();
  });

  it('renders Fixed Deposits nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-fixed-deposits')).toBeInTheDocument();
  });

  it('renders My Profile nav link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-profile')).toBeInTheDocument();
  });

  it('renders the logout button', () => {
    renderSidebar();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls auth.logout when Sign Out is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByTestId('logout-button'));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('renders dark overlay when isOpen is true', () => {
    renderSidebar(true);
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
    expect(overlay).toBeTruthy();
  });

  it('does not render overlay when isOpen is false', () => {
    renderSidebar(false);
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
    expect(overlay).toBeFalsy();
  });

  it('clicking the overlay calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSidebar(true, onClose);
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
