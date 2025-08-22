import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size]
        )}
        aria-label="Loading"
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

// Inline spinner for buttons and small spaces
export function InlineSpinner({ size = 'sm', className }: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
}

// Card skeleton for data cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </div>
        <div className="h-8 w-16 bg-muted rounded"></div>
        <div className="h-3 w-20 bg-muted rounded"></div>
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
}

// Full page loading overlay
export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg border p-6 shadow-lg">
        <LoadingSpinner size="lg" text={text} className="text-primary" />
      </div>
    </div>
  );
}

// Inline loading state for content areas
export function LoadingContent({ text = 'Loading...', className }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <LoadingSpinner size="md" text={text} className="text-muted-foreground" />
    </div>
  );
}