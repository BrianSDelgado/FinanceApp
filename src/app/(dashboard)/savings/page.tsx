'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, PiggyBank, Pencil, Trash2, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SavingsGoal } from '@/types';

export default function SavingsPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#10b981');
  const [fundsToAdd, setFundsToAdd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setGoals((data as SavingsGoal[]) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setColor('#10b981');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setDeadline(goal.deadline || '');
    setColor(goal.color);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      user_id: user!.id,
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
      deadline: deadline || null,
      color,
    };

    if (editingGoal) {
      await supabase.from('savings_goals').update(data).eq('id', editingGoal.id);
    } else {
      await supabase.from('savings_goals').insert(data);
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFundsModal) return;
    setSaving(true);

    const newAmount = Number(addFundsModal.current_amount) + parseFloat(fundsToAdd);
    await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', addFundsModal.id);

    setSaving(false);
    setAddFundsModal(null);
    setFundsToAdd('');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this savings goal?')) return;
    await supabase.from('savings_goals').delete().eq('id', id);
    fetchData();
  };

  const chartData = goals.map((g) => ({
    name: g.name,
    saved: Number(g.current_amount),
    remaining: Math.max(Number(g.target_amount) - Number(g.current_amount), 0),
    color: g.color,
  }));

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {formatCurrency(goals.reduce((s, g) => s + Number(g.current_amount), 0))} saved across {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* Progress Chart */}
      {goals.length > 0 && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Progress Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="saved" stackId="a" name="Saved" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="remaining" stackId="a" name="Remaining" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals"
          description="Set a savings goal and start tracking your progress."
          actionLabel="Add Goal"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const percentage = Number(goal.target_amount) > 0
              ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100
              : 0;
            return (
              <Card key={goal.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setAddFundsModal(goal);
                        setFundsToAdd('');
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                      title="Add funds"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEditModal(goal)} className="text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(Number(goal.current_amount))}
                  </span>
                  <span className="text-gray-500">{formatCurrency(Number(goal.target_amount))}</span>
                </div>
                <ProgressBar
                  value={Number(goal.current_amount)}
                  max={Number(goal.target_amount)}
                  color={`bg-[${goal.color}]`}
                  showLabel
                />
                {goal.deadline && (
                  <p className="mt-2 text-xs text-gray-500">Deadline: {formatDate(goal.deadline)}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingGoal ? 'Edit Goal' : 'Add Savings Goal'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="name"
            label="Goal Name"
            placeholder="e.g., Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="target"
            label="Target Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          <Input
            id="current"
            label="Current Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
          <Input
            id="deadline"
            label="Deadline (optional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {editingGoal ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal isOpen={!!addFundsModal} onClose={() => setAddFundsModal(null)} title={`Add Funds to ${addFundsModal?.name}`}>
        <form onSubmit={handleAddFunds} className="space-y-4">
          <Input
            id="funds"
            label="Amount to Add"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={fundsToAdd}
            onChange={(e) => setFundsToAdd(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddFundsModal(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              Add Funds
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
