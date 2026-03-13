import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const statusVariants: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
  PUBLISHED: { bg: 'bg-green-100', text: 'text-green-800' },
  ARCHIVED: { bg: 'bg-amber-100', text: 'text-amber-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
  HIDDEN: { bg: 'bg-slate-100', text: 'text-slate-600' },
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800' },
  PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800' },
  PARTIAL: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const colors = statusVariants[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  
  if (variant === 'outline') {
    return (
      <Badge variant="outline" className={cn('font-medium', className)}>
        {status}
      </Badge>
    );
  }
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      {status}
    </span>
  );
}

// Role badge
interface RoleBadgeProps {
  role: string;
  className?: string;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
  PROGRAM_ADMIN: { bg: 'bg-blue-100', text: 'text-blue-800' },
  CONTENT_EDITOR: { bg: 'bg-teal-100', text: 'text-teal-800' },
  PUBLIC_USER: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colors = roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      {role.replace('_', ' ')}
    </span>
  );
}
