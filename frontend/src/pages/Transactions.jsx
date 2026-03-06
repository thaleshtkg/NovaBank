import { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', category: '', search: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });

  const fetchTransactions = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 15 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/transactions', { params })
      .then(res => {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const applyFilters = () => fetchTransactions(1);
  const clearFilters = () => {
    setFilters({ type: '', category: '', search: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    setTimeout(() => fetchTransactions(1), 0);
  };

  const exportCSV = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/transactions/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="transactions-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total} transactions found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} data-testid="toggle-filters">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          <Button variant="outline" onClick={exportCSV} data-testid="export-csv">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Search..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                data-testid="filter-search"
              />
            </div>
            <Select
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
              options={[
                { value: '', label: 'All Types' },
                { value: 'credit', label: 'Credit (Income)' },
                { value: 'debit', label: 'Debit (Expense)' },
              ]}
              data-testid="filter-type"
            />
            <Select
              value={filters.category}
              onChange={e => setFilters({...filters, category: e.target.value})}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'utilities', label: 'Utilities' },
                { value: 'shopping', label: 'Shopping' },
                { value: 'entertainment', label: 'Entertainment' },
                { value: 'income', label: 'Income' },
                { value: 'opening', label: 'Opening' },
                { value: 'fixed_deposit', label: 'Fixed Deposit' },
              ]}
              data-testid="filter-category"
            />
            <div className="flex gap-2">
              <Input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="flex-1" data-testid="filter-start-date" />
              <Input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="flex-1" data-testid="filter-end-date" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={applyFilters} data-testid="apply-filters">Apply Filters</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transactions-table">
                <thead className="bg-gray-50 dark:bg-dark-bg">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-dark-border">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors" data-testid={`txn-row-${txn.id}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">{new Date(txn.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${txn.type === 'credit' ? 'bg-success-50 dark:bg-success-600/20' : 'bg-danger-50 dark:bg-danger-600/20'}`}>
                            {txn.type === 'credit' ? <ArrowDownRight className="w-3 h-3 text-success-600" /> : <ArrowUpRight className="w-3 h-3 text-danger-600" />}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{txn.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={txn.type === 'credit' ? 'success' : 'default'}>
                          {txn.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-400">{txn.reference_number}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-success-600' : 'text-danger-600'}`}>
                          {txn.type === 'credit' ? '+' : '-'}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ${txn.balance_after.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t dark:border-dark-border">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    data-testid="prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    data-testid="next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
