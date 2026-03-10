'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthName } from '@/lib/utils';
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react';
import type { Budget, Category } from '@/types';

export default function BudgetsPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, month, year]);

  const fetchData = async () => {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

    const [budgetRes, catRes, expRes] = await Promise.all([
      supabase.from('budgets').select('*, category:categories(*)').eq('user_id', user!.id).eq('month', month).eq('year', year),
      supabase.from('categories').select('*').eq('user_id', user!.id).order('name'),
      supabase.from('expenses').select('category_id, amount').eq('user_id', user!.id).gte('date', startOfMonth).lte('date', endOfMonth),
    ]);

    const expenses = expRes.data || [];
    const budgetsWithSpent = ((budgetRes.data as Budget[]) || []).map((b) => ({
      ...b,
      spent: expenses
        .filter((e) => e.category_id === b.category_id)
        .reduce((sum, e) => sum + Number(e.amount), 0),
    }));

    setBudgets(budgetsWithSpent);
    setCategories((catRes.data as Category[]) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId(categories[0]?.id || '');
    setAmount('');
    setModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.category_id);
    setAmount(String(budget.amount));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      user_id: user!.id,
      category_id: categoryId,
      amount: parseFloat(amount),
      month,
      year,
    };

    if (editingBudget) {
      await supabase.from('budgets').update(data).eq('id', editingBudget.id);
    } else {
      await supabase.from('budgets').insert(data);
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await supabase.from('budgets').delete().eq('id', id);
    fetchData();
  };

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {getMonthName(month)} {year} — {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)} spent
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Set Budget
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex gap-3">
        <Select
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
          options={Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: getMonthName(i + 1),
          }))}
        />
        <Select
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[year - 1, year, year + 1].map((y) => ({
            value: String(y),
            label: String(y),
          }))}
        />
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budgets set"
          description="Set budgets for your spending categories to stay on track."
          actionLabel="Set Budget"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const spent = budget.spent || 0;
            const isOver = spent > Number(budget.amount);
            return (
              <Card key={budget.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: budget.category?.color || '#6366f1' }}
                    />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {budget.category?.name || 'Unknown'}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(budget)} className="text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className={isOver ? 'font-semibold text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-gray-500">{formatCurrency(Number(budget.amount))}</span>
                </div>
                <ProgressBar
                  value={spent}
                  max={Number(budget.amount)}
                  color={isOver ? 'bg-red-500' : 'bg-indigo-600'}
                  showLabel={false}
                />
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBudget ? 'Edit Budget' : 'Set Budget'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            id="category"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Input
            id="amount"
            label="Budget Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {editingBudget ? 'Update' : 'Set'} Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
