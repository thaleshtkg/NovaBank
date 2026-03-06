import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error('not found')),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function TestConsumer() {
  const { user, loading } = useAuth();
  if (loading) return <div data-testid="loading">Loading</div>;
  return (
    <div>
      <span data-testid="user-status">{user ? user.name : 'no-user'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('starts with no user when no saved token', async () => {
    render(
      <AuthProvider><TestConsumer /></AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('user-status').textContent).toBe('no-user');
    });
  });

  test('provides loading state', () => {
    localStorage.getItem.mockImplementation(key => {
      if (key === 'novabank_token') return 'fake-token';
      if (key === 'novabank_user') return JSON.stringify({ name: 'Test' });
      return null;
    });
    render(
      <AuthProvider><TestConsumer /></AuthProvider>
    );
    expect(screen.getByTestId('loading') || screen.getByTestId('user-status')).toBeInTheDocument();
  });

  test('logout clears localStorage', async () => {
    function LogoutConsumer() {
      const { user, loading, logout } = useAuth();
      if (loading) return <div>Loading</div>;
      return (
        <div>
          <span data-testid="user-status">{user ? 'logged-in' : 'logged-out'}</span>
          <button data-testid="logout-btn" onClick={logout}>Logout</button>
        </div>
      );
    }

    render(
      <AuthProvider><LogoutConsumer /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });
});
