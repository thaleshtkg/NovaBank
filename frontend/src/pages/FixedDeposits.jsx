import { useState, useEffect } from 'react';
import { Landmark, Plus, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { calculateEstimatedFDReturn } from '../utils/finance';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const TENURE_OPTIONS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months (1 Year)' },
  { value: 24, label: '24 Months (2 Years)' },
  { value: 36, label: '36 Months (3 Years)' },
];

export default function FixedDeposits() {
  const [fds, setFds] = useState([]);
  const [interestRates, setInterestRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [breakTarget, setBreakTarget] = useState(null);
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [creating, setCreating] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const { user, refreshUser } = useAuth();
  const { refreshNotifications } = useOutletContext();

  const fetchFDs = () => {
    api.get('/fixed-deposits')
      .then(res => {
        setFds(res.data.fixedDeposits);
        setInterestRates(res.data.interestRates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFDs(); }, []);

  const handleCreate = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1000) return toast.error('Minimum FD amount is $1,000');
    if (!tenure) return toast.error('Select a tenure');
    if (amt > user.balance) return toast.error('Insufficient balance');

    setCreating(true);
    try {
      await api.post('/fixed-deposits', { amount: amt, tenure_months: parseInt(tenure) });
      toast.success('Fixed deposit created!');
      setShowCreate(false);
      setAmount('');
      setTenure('');
      fetchFDs();
      refreshUser();
      refreshNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create FD');
    } finally {
      setCreating(false);
    }
  };

  const handleBreak = async () => {
    setBreaking(true);
    try {
      const res = await api.post(`/fixed-deposits/${breakTarget.id}/break`);
      toast.success(`FD broken! Received $${res.data.totalReturn.toFixed(2)} (Interest: $${res.data.interest.toFixed(2)})`);
      setBreakTarget(null);
      fetchFDs();
      refreshUser();
      refreshNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to break FD');
    } finally {
      setBreaking(false);
    }
  };

  const activeFDs = fds.filter(fd => fd.status === 'active');
  const closedFDs = fds.filter(fd => fd.status !== 'active');
  const selectedRate = tenure ? interestRates[parseInt(tenure)] : null;

  const statusConfig = {
    active: { variant: 'success', icon: CheckCircle, label: 'Active' },
    matured: { variant: 'primary', icon: TrendingUp, label: 'Matured' },
    broken: { variant: 'danger', icon: XCircle, label: 'Broken' },
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="fixed-deposits-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fixed Deposits</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Grow your savings with guaranteed returns</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="create-fd-btn">
          <Plus className="w-4 h-4 mr-2" /> New FD
        </Button>
      </div>

      {Object.keys(interestRates).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(interestRates).map(([months, rate]) => (
            <Card key={months} className="p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{months} Months</p>
              <p className="text-lg font-bold text-primary-600">{rate}%</p>
              <p className="text-xs text-gray-400">p.a.</p>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeFDs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success-500" /> Active Deposits ({activeFDs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="active-fds">
                {activeFDs.map(fd => (
                  <Card key={fd.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                          <Landmark className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">${fd.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-gray-400">{fd.tenure_months} months @ {fd.interest_rate}%</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-900 dark:text-white">{new Date(fd.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Matures</span>
                        <span className="text-gray-900 dark:text-white">{new Date(fd.maturity_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Returns</span>
                        <span className="font-medium text-success-600">
                          ${calculateEstimatedFDReturn(fd.amount, fd.interest_rate, fd.tenure_months).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setBreakTarget(fd)} data-testid={`break-fd-${fd.id}`}>
                      Break FD (Premature Withdrawal)
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {closedFDs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Past Deposits ({closedFDs.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedFDs.map(fd => {
                  const cfg = statusConfig[fd.status] || statusConfig.broken;
                  return (
                    <Card key={fd.id} className="p-5 opacity-75">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gray-100 dark:bg-dark-border rounded-xl flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-300">${fd.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-400">{fd.tenure_months} months @ {fd.interest_rate}%</p>
                          </div>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {fds.length === 0 && (
            <Card className="p-12 text-center">
              <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No fixed deposits yet. Create one to start earning interest!</p>
            </Card>
          )}
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Fixed Deposit" size="sm">
        <div className="space-y-4">
          <Input
            label="Amount ($)"
            type="number"
            placeholder="Minimum $1,000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1000"
            step="100"
            data-testid="fd-amount"
          />
          <Select
            label="Tenure"
            value={tenure}
            onChange={e => setTenure(e.target.value)}
            options={[
              { value: '', label: 'Select tenure...' },
              ...TENURE_OPTIONS.map(t => ({ value: t.value, label: t.label })),
            ]}
            data-testid="fd-tenure"
          />
          {selectedRate && (
            <div className="bg-success-50 dark:bg-success-600/10 rounded-lg p-3">
              <p className="text-sm text-success-800 dark:text-success-400">
                Interest Rate: <strong>{selectedRate}% p.a.</strong>
              </p>
              {amount && parseFloat(amount) >= 1000 && (
                <p className="text-xs text-success-600 dark:text-success-500 mt-1">
                  Estimated returns: ${calculateEstimatedFDReturn(amount, selectedRate, parseInt(tenure)).toFixed(2)}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Available Balance: <span className="font-semibold text-gray-900 dark:text-white">${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} className="flex-1" data-testid="fd-submit">
              {creating ? 'Creating...' : 'Create FD'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!breakTarget} onClose={() => setBreakTarget(null)} title="Break Fixed Deposit" size="sm">
        {breakTarget && (
          <div>
            <div className="bg-warning-50 dark:bg-warning-600/10 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-800 dark:text-warning-400">Premature Withdrawal</p>
                <p className="text-xs text-warning-600 dark:text-warning-500 mt-1">
                  Breaking this FD early will incur a 1% penalty on the interest rate.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Principal</span>
                <span className="font-medium dark:text-white">${breakTarget.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rate</span>
                <span className="font-medium dark:text-white">{breakTarget.interest_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Penalty</span>
                <span className="font-medium text-danger-500">-1.0%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setBreakTarget(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleBreak} disabled={breaking} className="flex-1" data-testid="confirm-break-fd">
                {breaking ? 'Processing...' : 'Break FD'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
