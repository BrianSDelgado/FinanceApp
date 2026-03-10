'use client';

import { useEffect, useRef, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  'How can I reduce my grocery spending?',
  'What are some cheaper alternatives to eating out?',
  'Help me create a plan to save $1,000 in 3 months',
  'What subscriptions should I consider canceling?',
  'Tips for reducing my utility bills',
];

export default function AIAssistantPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFinancialContext = async () => {
    if (!user) return null;

    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [expRes, budRes, billRes, savRes, debtRes] = await Promise.all([
      supabase.from('expenses').select('amount, description, category:categories(name)').eq('user_id', user.id).gte('date', startOfMonth).lte('date', endOfMonth),
      supabase.from('budgets').select('amount, category:categories(name)').eq('user_id', user.id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
      supabase.from('bills').select('name, amount, is_paid').eq('user_id', user.id),
      supabase.from('savings_goals').select('name, target_amount, current_amount').eq('user_id', user.id),
      supabase.from('income_debts').select('type, name, amount').eq('user_id', user.id),
    ]);

    return {
      monthlyExpenses: expRes.data || [],
      budgets: budRes.data || [],
      bills: billRes.data || [],
      savingsGoals: savRes.data || [],
      incomeAndDebts: debtRes.data || [],
    };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: AIMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = await getFinancialContext();

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Sorry, I encountered an error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    }

    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-gray-500 dark:text-gray-400">Get personalized money-saving suggestions</p>
      </div>

      <Card padding={false} className="flex flex-1 flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
                <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                How can I help you save?
              </h3>
              <p className="mb-6 max-w-sm text-sm text-gray-500">
                I can analyze your spending, suggest savings strategies, and find cheaper alternatives.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me how to save money..."
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
