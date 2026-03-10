import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
      <Icon className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
