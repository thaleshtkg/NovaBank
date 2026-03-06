import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success(`Account created! Your account number: ${res.user.account_number}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NovaBank</h1>
          <p className="text-primary-300 mt-1">Create Your Account</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8" data-testid="register-form">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required data-testid="register-name" />
            <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required data-testid="register-email" />
            <Input label="Phone Number" name="phone" type="tel" placeholder="555-0100" value={form.phone} onChange={handleChange} required data-testid="register-phone" />
            <div className="relative">
              <Input label="Password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required data-testid="register-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required data-testid="register-confirm" />
            <Button type="submit" disabled={loading} className="w-full" size="lg" data-testid="register-submit">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">New accounts receive a $1,000,000 welcome bonus</p>
        </div>
      </div>
    </div>
  );
}
