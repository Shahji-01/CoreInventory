import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
    info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
    warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none'
      }}>
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';
          
          const Icon = isError ? XCircle : isSuccess ? CheckCircle : isWarning ? AlertTriangle : Info;
          const bgColor = isError ? 'var(--rose-light)' : isSuccess ? 'var(--emerald-light)' : isWarning ? 'var(--amber-light)' : 'var(--blue-light)';
          const color = isError ? 'var(--rose)' : isSuccess ? 'var(--emerald)' : isWarning ? 'var(--amber)' : 'var(--blue)';
          const borderColor = isError ? 'rgba(244,63,94,0.2)' : isSuccess ? 'rgba(16,185,129,0.2)' : isWarning ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)';

          return (
            <div key={t.id} style={{
              background: 'var(--bg-elevated)', border: `1px solid ${borderColor}`, borderLeft: `4px solid ${color}`,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              borderRadius: 8, padding: '12px 16px', minWidth: 300, maxWidth: 400,
              pointerEvents: 'auto', display: 'flex', gap: 12, alignItems: 'flex-start',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
              <Icon size={18} style={{ color, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                {t.message && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{t.message}</div>}
              </div>
              <button 
                onClick={() => removeToast(t.id)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, marginTop: -2, marginRight: -4, display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
};
