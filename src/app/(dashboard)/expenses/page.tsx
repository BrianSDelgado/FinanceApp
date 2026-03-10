'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import type { Expense, Category } from '@/types';

export default function ExpensesPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [expRes, catRes] = await Promise.all([
      supabase.from('expenses').select('*, category:categories(*)').eq('user_id', user!.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user!.id).order('name'),
    ]);
    setExpenses((expRes.data as Expense[]) || []);
    setCategories((catRes.data as Category[]) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setAmount('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(String(expense.amount));
    setDescription(expense.description);
    setCategoryId(expense.category_id || '');
    setDate(expense.date);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      user_id: user!.id,
      amount: parseFloat(amount),
      description,
      category_id: categoryId || null,
      date,
    };

    if (editingExpense) {
      await supabase.from('expenses').update(data).eq('id', editingExpense.id);
    } else {
      await supabase.from('expenses').insert(data);
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and categorize your spending</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Start tracking your spending by adding your first expense."
          actionLabel="Add Expense"
          onAction={openAddModal}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4">
                      {expense.category && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${expense.category.color}20`,
                            color: expense.category.color,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: expense.category.color }} />
                          {expense.category.name}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button onClick={() => openEditModal(expense)} className="mr-2 text-gray-400 hover:text-indigo-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExpense ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="amount"
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            id="description"
            label="Description"
            placeholder="What did you spend on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Select
            id="category"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: '', label: 'Select category' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input
            id="date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {editingExpense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
