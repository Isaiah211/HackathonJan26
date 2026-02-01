import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

/**
 * Toast Hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Toast Provider
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Individual Toast Component
 */
const Toast = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colorClasses = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-accent-50 border-accent-200 text-accent-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-brand-50 border-brand-200 text-brand-900',
  };

  const iconColorClasses = {
    success: 'text-success-600',
    error: 'text-accent-600',
    warning: 'text-yellow-600',
    info: 'text-brand-600',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${colorClasses[toast.type]} animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      <div className={iconColorClasses[toast.type]}>
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current rounded"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
