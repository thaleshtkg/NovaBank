import { useState, useEffect } from 'react';
import { ArrowLeftRight, Shield, AlertCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

export default function Transfer() {
  const [payees, setPayees] = useState([]);
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user, refreshUser } = useAuth();
  const { refreshNotifications } = useOutletContext();

  useEffect(() => {
    api.get('/payees').then(res => setPayees(res.data.payees)).catch(() => {});
  }, []);

  const handleConfirm = () => {
    if (!selectedPayee) return toast.error('Select a payee');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > 1000) return toast.error('Maximum transfer is $1,000 per transaction');
    if (amt > user.balance) return toast.error('Insufficient balance');
    setStep(2);
  };

  const handleTransfer = async () => {
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/transfers', {
        payee_id: parseInt(selectedPayee),
        amount: parseFloat(amount),
        description: description || undefined,
        otp,
      });
      setResult(res.data);
      setStep(3);
      refreshUser();
      refreshNotifications();
      toast.success('Transfer successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPayee('');
    setAmount('');
    setDescription('');
    setOtp('');
    setStep(1);
    setResult(null);
  };

  const selectedPayeeInfo = payees.find(p => p.id === parseInt(selectedPayee));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn" data-testid="transfer-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfer Money</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Send money to your registered payees</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500'}`}>
              {s}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Verify' : 'Done'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-950/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Transfer Limit</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">Max $1,000 per transaction. Rate limited to 5 transfers/minute.</p>
              </div>
            </div>

            <Select
              label="Select Payee"
              value={selectedPayee}
              onChange={e => setSelectedPayee(e.target.value)}
              options={[
                { value: '', label: 'Choose a payee...' },
                ...payees.map(p => ({ value: p.id, label: `${p.name} - ${p.bank_name} (${p.account_number})` })),
              ]}
              data-testid="transfer-payee"
            />

            <Input
              label="Amount ($)"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0.01"
              max="1000"
              step="0.01"
              data-testid="transfer-amount"
            />

            <Input
              label="Description (Optional)"
              placeholder="What's this for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              data-testid="transfer-description"
            />

            <p className="text-sm text-gray-500">
              Available Balance: <span className="font-semibold text-gray-900 dark:text-white">${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>

            <Button onClick={handleConfirm} className="w-full" size="lg" data-testid="transfer-continue">
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Transfer</h3>
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPayeeInfo?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPayeeInfo?.bank_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPayeeInfo?.account_number}</span>
              </div>
              <div className="flex justify-between text-sm border-t dark:border-dark-border pt-2 mt-2">
                <span className="text-gray-500">Amount</span>
                <span className="text-lg font-bold text-primary-600">${parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-warning-50 dark:bg-warning-600/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-warning-600" />
                <p className="text-sm font-medium text-warning-800 dark:text-warning-500">OTP Verification</p>
              </div>
              <p className="text-xs text-warning-600 dark:text-warning-400 mb-3">For QA testing, use OTP: <strong>123456</strong></p>
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                data-testid="transfer-otp"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleTransfer} disabled={loading} className="flex-1" data-testid="transfer-submit">
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && result && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-success-50 dark:bg-success-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-success-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transfer Successful!</h3>
          <p className="text-3xl font-bold text-success-600 mb-4">${result.amount?.toFixed(2)}</p>
          <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-2 text-left mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sent To</span>
              <span className="font-medium dark:text-white">{result.payee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reference</span>
              <span className="font-mono text-xs dark:text-white" data-testid="transfer-ref">{result.referenceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Balance</span>
              <span className="font-medium dark:text-white">${result.newBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <Button onClick={resetForm} className="w-full" data-testid="transfer-new">Make Another Transfer</Button>
        </Card>
      )}
    </div>
  );
}
