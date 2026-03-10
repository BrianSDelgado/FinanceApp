'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { Plus, Calculator, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { IncomeDebt } from '@/types';

export default function DebtRatioPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [entries, setEntries] = useState<IncomeDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'debt'>('income');

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('income_debts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at');
    setEntries((data as IncomeDebt[]) || []);
    setLoading(false);
  };

  const openModal = (type: 'income' | 'debt') => {
    setEntryType(type);
    setName('');
    setAmount('');
    setIsMonthly(true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase.from('income_debts').insert({
      user_id: user!.id,
      type: entryType,
      name,
      amount: parseFloat(amount),
      is_monthly: isMonthly,
    });

    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('income_debts').delete().eq('id', id);
    fetchData();
  };

  const incomeEntries = entries.filter((e) => e.type === 'income');
  const debtEntries = entries.filter((e) => e.type === 'debt');
  const totalIncome = incomeEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalDebt = debtEntries.reduce((s, e) => s + Number(e.amount), 0);
  const ratio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

  const getRatingColor = (r: number) => {
    if (r <= 20) return 'text-emerald-600';
    if (r <= 36) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (r: number) => {
    if (r <= 20) return 'Excellent';
    if (r <= 36) return 'Manageable';
    if (r <= 50) return 'Concerning';
    return 'Critical';
  };

  const pieData = [
    { name: 'Debt Payments', value: totalDebt, color: '#ef4444' },
    { name: 'Remaining Income', value: Math.max(totalIncome - totalDebt, 0), color: '#22c55e' },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income-to-Debt Ratio</h1>
        <p className="text-gray-500 dark:text-gray-400">Calculate how much of your income goes to debt payments</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No data yet"
          description="Add your income and debt payments to calculate your ratio."
          actionLabel="Add Income"
          onAction={() => openModal('income')}
        />
      ) : (
        <>
          {/* Ratio Display */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col items-center justify-center text-center">
              <p className="mb-2 text-sm text-gray-500">Your Debt-to-Income Ratio</p>
              <p className={`text-5xl font-bold ${getRatingColor(ratio)}`}>{ratio.toFixed(1)}%</p>
              <p className={`mt-1 text-lg font-medium ${getRatingColor(ratio)}`}>{getRatingLabel(ratio)}</p>
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <p>Below 20% = Excellent</p>
                <p>20-36% = Manageable</p>
                <p>36-50% = Concerning</p>
                <p>Above 50% = Critical</p>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">Breakdown</h3>
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-600 dark:text-gray-400">Available: {formatCurrency(Math.max(totalIncome - totalDebt, 0))}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-gray-600 dark:text-gray-400">Debt: {formatCurrency(totalDebt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Income & Debt Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Income
            </h2>
            <Button size="sm" onClick={() => openModal('income')}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
          {incomeEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No income entries</p>
          ) : (
            incomeEntries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-gray-500">{entry.is_monthly ? 'Monthly' : 'One-time'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-600">{formatCurrency(Number(entry.amount))}</span>
                    <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <TrendingDown className="h-5 w-5 text-red-500" /> Debt Payments
            </h2>
            <Button size="sm" variant="danger" onClick={() => openModal('debt')}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
          {debtEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No debt entries</p>
          ) : (
            debtEntries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-gray-500">{entry.is_monthly ? 'Monthly' : 'One-time'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600">{formatCurrency(Number(entry.amount))}</span>
                    <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Add ${entryType === 'income' ? 'Income' : 'Debt Payment'}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="name"
            label="Name"
            placeholder={entryType === 'income' ? 'e.g., Salary' : 'e.g., Car Payment'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="amount"
            label="Monthly Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="monthly"
              checked={isMonthly}
              onChange={(e) => setIsMonthly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="monthly" className="text-sm text-gray-700 dark:text-gray-300">
              Recurring monthly
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              Add {entryType === 'income' ? 'Income' : 'Debt'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
