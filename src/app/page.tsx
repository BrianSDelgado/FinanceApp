import { TrendingUp, PiggyBank, Receipt, Bot } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            Saving<span className="text-indigo-600">Plus</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:py-32">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-6xl">
          Take Control of Your{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
            Finances
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Track expenses, plan budgets, monitor bills, and reach your savings goals — all powered by AI that helps you save smarter.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
        >
          Start Saving Today
          <TrendingUp className="h-5 w-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Receipt,
              title: 'Expense Tracking',
              desc: 'Categorize and track every dollar. See exactly where your money goes each month.',
            },
            {
              icon: PiggyBank,
              title: 'Savings Goals',
              desc: 'Set targets, track progress with visual charts, and hit your financial milestones.',
            },
            {
              icon: Bot,
              title: 'AI Assistant',
              desc: 'Get personalized money-saving suggestions and cheaper alternatives powered by AI.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <f.icon className="mb-3 h-10 w-10 text-indigo-600" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
