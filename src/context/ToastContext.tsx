import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type?: 'info' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Wrapper */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const borderColor = toast.type === 'error' ? 'border-red-500/50' : 'border-surface-borderLight';
          const indicatorColor = toast.type === 'error' ? 'bg-red-400' : 'bg-sky-400';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-surface-card border ${borderColor} text-slate-200 text-xs font-medium shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} flex-shrink-0`} />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
