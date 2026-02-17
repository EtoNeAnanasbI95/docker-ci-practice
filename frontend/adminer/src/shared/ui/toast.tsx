'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

type ToastVariant = 'info' | 'success' | 'error';

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={containerStyle} aria-live="polite" role="status">
        {toasts.map((toast) => (
          <div key={toast.id} style={{ ...toastStyle, ...variantStyle[toast.variant] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast должен вызываться внутри ToastProvider');
  }
  return context;
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  zIndex: 9999,
  pointerEvents: 'none',
};

const toastStyle: CSSProperties = {
  minWidth: '240px',
  maxWidth: '320px',
  padding: '12px 14px',
  borderRadius: '12px',
  color: '#0f172a',
  backgroundColor: '#e2e8f0',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
  fontSize: '14px',
  fontWeight: 500,
  pointerEvents: 'auto',
};

const variantStyle: Record<ToastVariant, CSSProperties> = {
  info: {},
  success: { backgroundColor: '#dcfce7', color: '#14532d' },
  error: { backgroundColor: '#fee2e2', color: '#7f1d1d' },
};
