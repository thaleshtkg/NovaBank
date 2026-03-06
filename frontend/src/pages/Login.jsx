import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Eye, EyeOff, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (testEmail) => {
    setEmail(testEmail);
    setPassword('Test@1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NovaBank</h1>
          <p className="text-primary-300 mt-1">QA Testing Portal</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8" data-testid="login-form">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@novabank.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              data-testid="login-email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                data-testid="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg" data-testid="login-submit">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create Account
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-primary-800/50 backdrop-blur rounded-xl p-5 border border-primary-700/50" data-testid="test-credentials">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary-300" />
            <h3 className="text-sm font-semibold text-primary-200">QA Test Credentials</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => fillCredentials('john@novabank.com')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-primary-900/50 hover:bg-primary-900 transition-colors text-left group"
              data-testid="test-cred-john"
            >
              <div>
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-primary-400">john@novabank.com / Test@1234</p>
              </div>
              <span className="text-xs text-primary-400 group-hover:text-primary-200">Click to fill</span>
            </button>
            <button
              onClick={() => fillCredentials('jane@novabank.com')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-primary-900/50 hover:bg-primary-900 transition-colors text-left group"
              data-testid="test-cred-jane"
            >
              <div>
                <p className="text-sm font-medium text-white">Jane Smith</p>
                <p className="text-xs text-primary-400">jane@novabank.com / Test@1234</p>
              </div>
              <span className="text-xs text-primary-400 group-hover:text-primary-200">Click to fill</span>
            </button>
          </div>
          <p className="text-xs text-primary-400 mt-3 text-center">Both accounts pre-loaded with $1,000,000</p>
        </div>
      </div>
    </div>
  );
}
