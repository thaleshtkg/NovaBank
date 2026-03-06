import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../context/AuthContext';

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

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('renders login form', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  test('renders NovaBank branding', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText('NovaBank')).toBeInTheDocument();
      expect(screen.getByText('QA Testing Portal')).toBeInTheDocument();
    });
  });

  test('renders email and password fields', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('john@novabank.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });
  });

  test('renders sign in button', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-submit')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit').textContent).toBe('Sign In');
    });
  });

  test('renders test credentials section', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('test-credentials')).toBeInTheDocument();
      expect(screen.getByTestId('test-cred-john')).toBeInTheDocument();
      expect(screen.getByTestId('test-cred-jane')).toBeInTheDocument();
    });
  });

  test('fills John credentials on click', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('test-cred-john')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('test-cred-john'));
    expect(screen.getByPlaceholderText('john@novabank.com')).toHaveValue('john@novabank.com');
    expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('Test@1234');
  });

  test('fills Jane credentials on click', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('test-cred-jane')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('test-cred-jane'));
    expect(screen.getByPlaceholderText('john@novabank.com')).toHaveValue('jane@novabank.com');
    expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('Test@1234');
  });

  test('has link to registration page', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Create Account').closest('a')).toHaveAttribute('href', '/register');
    });
  });

  test('toggles password visibility', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
