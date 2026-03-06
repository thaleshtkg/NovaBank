import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, ArrowUpRight, ArrowDownRight, ArrowLeftRight,
  Receipt, Landmark, TrendingUp, CreditCard, Clock
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SpendingChart from '../components/SpendingChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentTxns, setRecentTxns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/account/balance'),
      api.get('/transactions/recent'),
      api.get('/transactions/summary'),
    ]).then(([balRes, txnRes, sumRes]) => {
      setBalance(balRes.data);
      setRecentTxns(txnRes.data.transactions);
      setSummary(sumRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { to: '/transfer', icon: ArrowLeftRight, label: 'Transfer', color: 'bg-primary-500' },
    { to: '/bills', icon: Receipt, label: 'Pay Bills', color: 'bg-warning-500' },
    { to: '/fixed-deposits', icon: Landmark, label: 'Fixed Deposit', color: 'bg-success-500' },
    { to: '/transactions', icon: Clock, label: 'History', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's your financial overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 border-0 text-white col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm">Total Balance</p>
              <p className="text-3xl font-bold mt-1" data-testid="balance-amount">
                ${balance?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-primary-200 text-sm mt-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Account: {balance?.accountNumber}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Income</span>
              <ArrowDownRight className="w-4 h-4 text-success-500" />
            </div>
            <p className="text-xl font-bold text-success-600" data-testid="total-credit">
              ${summary?.totalCredit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Spent</span>
              <ArrowUpRight className="w-4 h-4 text-danger-500" />
            </div>
            <p className="text-xl font-bold text-danger-600" data-testid="total-debit">
              ${summary?.totalDebit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}>
            <Card hover className="p-4 text-center">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3" data-testid="recent-transactions">
              {recentTxns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-success-50 dark:bg-success-600/20' : 'bg-danger-50 dark:bg-danger-600/20'}`}>
                      {txn.type === 'credit'
                        ? <ArrowDownRight className="w-4 h-4 text-success-600" />
                        : <ArrowUpRight className="w-4 h-4 text-danger-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{txn.description}</p>
                      <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-success-600' : 'text-danger-600'}`}>
                    {txn.type === 'credit' ? '+' : '-'}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h2>
          <SpendingChart categories={summary?.categories || []} />
        </Card>
      </div>
    </div>
  );
}
