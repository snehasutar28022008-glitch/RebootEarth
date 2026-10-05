export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-forest-100 border-t-forest-500`} />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-forest-100 border-t-forest-500" />
        <p className="text-sm font-medium text-forest-600">Loading Reboot Earth...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton h-6 w-2/3 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-3/4 mb-4" />
      <div className="skeleton h-10 w-1/2" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-forest-900/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 mb-4">
        <Icon className="h-8 w-8 text-forest-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-forest-800 mb-2">{title}</h3>
      <p className="text-sm text-forest-600 max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-8 animate-fade-in-up">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-emerald-light shadow-lg shadow-forest-500/20">
          <Icon className="h-7 w-7 text-white" />
        </div>
      )}
      <h1 className="font-display text-3xl font-bold text-forest-800 sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-forest-600 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-forest-800">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-forest-600">{subtitle}</p>}
    </div>
  );
}
