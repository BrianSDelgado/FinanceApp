'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import { DollarSign, TrendingDown, CalendarClock, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Expense, Bill, SavingsGoal, Category } from '@/types';

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#06b6d4', '#64748b'];

export default function DashboardPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const month = getCurrentMonth();
  const year = getCurrentYear();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

      const [expRes, billRes, savRes, catRes] = await Promise.all([
        supabase.from('expenses').select('*, category:categories(*)').eq('user_id', user.id).gte('date', startOfMonth).lte('date', endOfMonth).order('date', { ascending: false }),
        supabase.from('bills').select('*').eq('user_id', user.id).eq('is_paid', false).order('due_date'),
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ]);

      setExpenses((expRes.data as Expense[]) || []);
      setBills((billRes.data as Bill[]) || []);
      setSavingsGoals((savRes.data as SavingsGoal[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user, supabase, month, year]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const upcomingBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  // Category breakdown for pie chart
  const categoryData = categories
    .map((cat) => ({
      name: cat.name,
      value: expenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + Number(e.amount), 0),
      color: cat.color,
    }))
    .filter((c) => c.value > 0);

  // Daily spending for bar chart
  const dailySpending: Record<string, number> = {};
  expenses.forEach((e) => {
    const day = new Date(e.date).getDate().toString();
    dailySpending[day] = (dailySpending[day] || 0) + Number(e.amount);
  });
  const dailyData = Object.entries(dailySpending)
    .map(([day, amount]) => ({ day: `Day ${day}`, amount }))
    .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Your financial overview for this month</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Spending</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Bills</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(upcomingBills)}</p>
            </div>
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <CalendarClock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
              <PiggyBank className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Savings Progress</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalTarget > 0 ? `${((totalSaved / totalTarget) * 100).toFixed(0)}%` : '0%'}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
              <ArrowUpRight className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Daily Spending</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-gray-400">No expenses recorded this month</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-gray-400">No category data yet</p>
          )}
          {categoryData.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {categoryData.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: expense.category?.color || '#6366f1' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.category?.name || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    <ArrowDownRight className="mr-1 inline h-3 w-3" />
                    {formatCurrency(Number(expense.amount))}
                  </p>
                  <p className="text-xs text-gray-500">{expense.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">No expenses yet. Start tracking your spending!</p>
        )}
      </Card>
    </div>
  );
}
