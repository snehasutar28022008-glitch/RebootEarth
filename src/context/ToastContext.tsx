import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconFor = (type: ToastType) => {
    const className = 'w-5 h-5 flex-shrink-0';
    switch (type) {
      case 'success': return <CheckCircle className={`${className} text-forest-500`} />;
      case 'error': return <XCircle className={`${className} text-hazard`} />;
      case 'warning': return <AlertCircle className={`${className} text-amber-dark`} />;
      case 'info': return <Info className={`${className} text-forest-500`} />;
    }
  };

  const bgFor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-forest-200';
      case 'error': return 'border-red-200';
      case 'warning': return 'border-amber-light/40';
      case 'info': return 'border-forest-100';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-in-right flex items-start gap-3 rounded-2xl border-2 ${bgFor(toast.type)} bg-white px-4 py-3 shadow-lg max-w-sm`}
          >
            {iconFor(toast.type)}
            <p className="flex-1 text-sm font-medium text-forest-900">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
