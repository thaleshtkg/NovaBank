import { useState, useEffect } from 'react';
import { Receipt, Zap, Droplets, Wifi, Phone, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { calculateDaysUntilDue, getBillBadgeVariant, getBillDueLabel } from '../utils/finance';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const categoryIcons = {
  electricity: Zap,
  water: Droplets,
  internet: Wifi,
  phone: Phone,
};

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState(null);
  const [paying, setPaying] = useState(false);
  const { refreshUser } = useAuth();
  const { refreshNotifications } = useOutletContext();

  const fetchBills = () => {
    api.get('/bills')
      .then(res => setBills(res.data.bills))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.post(`/bills/${payTarget.id}/pay`);
      toast.success(`Bill paid successfully!`);
      setPayTarget(null);
      fetchBills();
      refreshUser();
      refreshNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const pending = bills.filter(b => b.status === 'pending');
  const paid = bills.filter(b => b.status === 'paid');

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="bills-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bill Payments</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Pay your utility bills online</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning-500" /> Pending Bills ({pending.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="pending-bills">
                {pending.map(bill => {
                  const Icon = categoryIcons[bill.category] || Receipt;
                  const daysUntilDue = calculateDaysUntilDue(bill.due_date);
                  return (
                    <Card key={bill.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{bill.biller_name}</p>
                            <p className="text-xs text-gray-400 capitalize">{bill.category}</p>
                          </div>
                        </div>
                        <Badge variant={getBillBadgeVariant(daysUntilDue)}>
                          {getBillDueLabel(daysUntilDue)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">${bill.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" onClick={() => setPayTarget(bill)} data-testid={`pay-bill-${bill.id}`}>
                          Pay Now
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" /> Paid Bills ({paid.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="paid-bills">
                {paid.map(bill => {
                  const Icon = categoryIcons[bill.category] || Receipt;
                  return (
                    <Card key={bill.id} className="p-5 opacity-75">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-success-50 dark:bg-success-600/10 rounded-xl flex items-center justify-center">
                            <Icon className="w-5 h-5 text-success-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{bill.biller_name}</p>
                            <p className="text-xs text-gray-400 capitalize">{bill.category}</p>
                          </div>
                        </div>
                        <Badge variant="success">Paid</Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-xl font-bold text-gray-500">${bill.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Paid on: {new Date(bill.paid_at).toLocaleDateString()}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {bills.length === 0 && (
            <Card className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No bills at the moment</p>
            </Card>
          )}
        </>
      )}

      <Modal isOpen={!!payTarget} onClose={() => setPayTarget(null)} title="Confirm Payment" size="sm">
        {payTarget && (
          <div>
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Biller</span>
                <span className="font-medium dark:text-white">{payTarget.biller_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium dark:text-white capitalize">{payTarget.category}</span>
              </div>
              <div className="flex justify-between text-sm border-t dark:border-dark-border pt-2">
                <span className="text-gray-500">Amount</span>
                <span className="text-lg font-bold text-primary-600">${payTarget.amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPayTarget(null)} className="flex-1">Cancel</Button>
              <Button onClick={handlePay} disabled={paying} className="flex-1" data-testid="confirm-pay-bill">
                {paying ? 'Processing...' : 'Pay Bill'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
