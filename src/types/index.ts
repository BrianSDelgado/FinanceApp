export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent?: number;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  is_recurring: boolean;
  recurrence: 'weekly' | 'monthly' | 'yearly' | null;
  is_paid: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeDebt {
  id: string;
  user_id: string;
  type: 'income' | 'debt';
  name: string;
  amount: number;
  is_monthly: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}
