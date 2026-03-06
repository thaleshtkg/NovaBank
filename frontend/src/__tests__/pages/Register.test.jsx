import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
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

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Register Page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('renders register form', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });
  });

  test('renders all form fields', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('555-0100')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
    });
  });

  test('renders submit button', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByTestId('register-submit')).toBeInTheDocument();
      expect(screen.getByTestId('register-submit').textContent).toBe('Create Account');
    });
  });

  test('has link to login page', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign In').closest('a')).toHaveAttribute('href', '/login');
    });
  });

  test('displays NovaBank branding', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByText('NovaBank')).toBeInTheDocument();
      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    });
  });

  test('displays welcome bonus text', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByText(/\$1,000,000 welcome bonus/)).toBeInTheDocument();
    });
  });

  test('allows filling form fields', async () => {
    renderRegister();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User', name: 'name' } });
    expect(screen.getByPlaceholderText('John Doe')).toHaveValue('Test User');
  });
});
