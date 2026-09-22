import React from 'react';
import { useGit } from '../context/GitContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Toasts() {
  const { toasts, removeToast } = useGit();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <Info size={16} style={{ color: 'var(--status-info-text)' }} />;
        if (toast.type === 'success') icon = <CheckCircle2 size={16} style={{ color: 'var(--status-success-text)' }} />;
        if (toast.type === 'danger') icon = <AlertCircle size={16} style={{ color: 'var(--status-danger-text)' }} />;
        if (toast.type === 'warning') icon = <AlertTriangle size={16} style={{ color: 'var(--status-warning-text)' }} />;

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {icon}
              <span>{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
