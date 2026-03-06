import { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Building, Calendar, Edit2, Save, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { refreshUser } = useAuth();

  const fetchProfile = () => {
    api.get('/account/profile')
      .then(res => {
        setProfile(res.data.user);
        setName(res.data.user.name);
        setPhone(res.data.user.phone);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await api.put('/account/profile', { name: name.trim(), phone: phone.trim() });
      setProfile(res.data.user);
      setEditing(false);
      refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(profile.name);
    setPhone(profile.phone);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const infoRows = [
    { icon: Mail, label: 'Email', value: profile.email, testId: 'profile-email' },
    { icon: Phone, label: 'Phone', value: profile.phone || 'Not set', testId: 'profile-phone' },
    { icon: CreditCard, label: 'Account Number', value: profile.account_number, testId: 'profile-account' },
    { icon: Building, label: 'Account Type', value: profile.account_type?.charAt(0).toUpperCase() + profile.account_type?.slice(1), testId: 'profile-type' },
    { icon: Calendar, label: 'Member Since', value: new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), testId: 'profile-since' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn" data-testid="profile-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View and manage your account details</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-dark-border">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                data-testid="profile-name-input"
              />
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="profile-name">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </>
            )}
          </div>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} data-testid="edit-profile-btn">
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} data-testid="save-profile-btn">
                <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {infoRows.map(row => {
            const Icon = row.icon;
            const isPhone = row.label === 'Phone';
            return (
              <div key={row.label} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{row.label}</p>
                  {editing && isPhone ? (
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="mt-0.5"
                      data-testid="profile-phone-input"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" data-testid={row.testId}>{row.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Account Balance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary-600" data-testid="profile-balance">
              ${profile.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">Available Balance</p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
      </Card>
    </div>
  );
}
