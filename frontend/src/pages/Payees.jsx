import { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, Building, Hash } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function Payees() {
  const [payees, setPayees] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', account_number: '', bank_name: '', routing_number: '', nickname: '' });

  const fetchPayees = (q = '') => {
    api.get('/payees', { params: { search: q || undefined } })
      .then(res => setPayees(res.data.payees))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayees(); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    fetchPayees(val);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payees', form);
      toast.success('Payee added successfully');
      setShowAdd(false);
      setForm({ name: '', account_number: '', bank_name: '', routing_number: '', nickname: '' });
      fetchPayees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add payee');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/payees/${deleteTarget.id}`);
      toast.success('Payee removed');
      setDeleteTarget(null);
      fetchPayees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove payee');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="payees-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payees</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your registered beneficiaries</p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="add-payee-button">
          <UserPlus className="w-4 h-4 mr-2" /> Add Payee
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Search payees..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          data-testid="payee-search"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payees.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payees found. Add your first payee to start transferring.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="payee-list">
          {payees.map(p => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">{p.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                    {p.nickname && <p className="text-xs text-gray-400">({p.nickname})</p>}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-600/10 text-gray-400 hover:text-danger-500 transition-colors"
                  data-testid={`delete-payee-${p.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Building className="w-3.5 h-3.5" /> {p.bank_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Hash className="w-3.5 h-3.5" /> {p.account_number}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Payee">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Payee Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="payee-name" />
          <Input label="Account Number" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} required data-testid="payee-account" />
          <Input label="Bank Name" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} required data-testid="payee-bank" />
          <Input label="Routing Number" value={form.routing_number} onChange={e => setForm({...form, routing_number: e.target.value})} required data-testid="payee-routing" />
          <Input label="Nickname (Optional)" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} data-testid="payee-nickname" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" data-testid="payee-submit">Add Payee</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Payee" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from your payees?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1" data-testid="confirm-delete-payee">Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
