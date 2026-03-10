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
import { Plus, CalendarClock, Pencil, Trash2, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bill } from '@/types';

export default function BillsPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<string>('monthly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user!.id)
      .order('due_date');
    setBills((data as Bill[]) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingBill(null);
    setName('');
    setAmount('');
    setDueDate('');
    setIsRecurring(false);
    setRecurrence('monthly');
    setModalOpen(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmount(String(bill.amount));
    setDueDate(bill.due_date);
    setIsRecurring(bill.is_recurring);
    setRecurrence(bill.recurrence || 'monthly');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      user_id: user!.id,
      name,
      amount: parseFloat(amount),
      due_date: dueDate,
      is_recurring: isRecurring,
      recurrence: isRecurring ? recurrence : null,
      is_paid: false,
    };

    if (editingBill) {
      await supabase.from('bills').update(data).eq('id', editingBill.id);
    } else {
      await supabase.from('bills').insert(data);
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const togglePaid = async (bill: Bill) => {
    await supabase.from('bills').update({ is_paid: !bill.is_paid }).eq('id', bill.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill?')) return;
    await supabase.from('bills').delete().eq('id', id);
    fetchData();
  };

  const unpaidBills = bills.filter((b) => !b.is_paid);
  const paidBills = bills.filter((b) => b.is_paid);

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {unpaidBills.length} upcoming — {formatCurrency(unpaidBills.reduce((s, b) => s + Number(b.amount), 0))} due
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bills tracked"
          description="Add your upcoming bills so you never miss a payment."
          actionLabel="Add Bill"
          onAction={openAddModal}
        />
      ) : (
        <>
          {/* Upcoming */}
          {unpaidBills.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-gray-500">Upcoming</h2>
              {unpaidBills.map((bill) => (
                <Card key={bill.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => togglePaid(bill)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 hover:border-emerald-500 hover:text-emerald-500"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{bill.name}</p>
                        <p className={cn('text-sm', isOverdue(bill.due_date) ? 'font-semibold text-red-500' : 'text-gray-500')}>
                          Due {formatDate(bill.due_date)}
                          {isOverdue(bill.due_date) && ' — Overdue'}
                          {bill.is_recurring && (
                            <span className="ml-2 inline-flex items-center gap-1 text-indigo-500">
                              <RotateCcw className="h-3 w-3" /> {bill.recurrence}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Number(bill.amount))}
                      </span>
                      <button onClick={() => openEditModal(bill)} className="text-gray-400 hover:text-indigo-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(bill.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Paid */}
          {paidBills.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-gray-500">Paid</h2>
              {paidBills.map((bill) => (
                <Card key={bill.id} className="opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => togglePaid(bill)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <div>
                        <p className="font-medium text-gray-900 line-through dark:text-white">{bill.name}</p>
                        <p className="text-sm text-gray-500">{formatDate(bill.due_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-500">{formatCurrency(Number(bill.amount))}</span>
                      <button onClick={() => handleDelete(bill.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBill ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="name"
            label="Bill Name"
            placeholder="e.g., Netflix, Rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            id="dueDate"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">
              Recurring bill
            </label>
          </div>
          {isRecurring && (
            <Select
              id="recurrence"
              label="Frequency"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {editingBill ? 'Update' : 'Add'} Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
