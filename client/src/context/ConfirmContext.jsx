import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext(null);

let globalConfirmHandler = null;

/**
 * Universal Promise-based confirmation dialog.
 * Can be called anywhere (inside or outside React components).
 *
 * Example:
 * const ok = await confirmAction({
 *   title: 'Delete User Account',
 *   message: 'Are you sure you want to delete this user? This cannot be undone.',
 *   confirmText: 'Delete User',
 *   type: 'danger'
 * });
 */
export const confirmAction = (options) => {
  if (globalConfirmHandler) {
    return globalConfirmHandler(options);
  }
  // Fallback if context is not mounted
  const msg = typeof options === 'string' ? options : options?.message || options?.title || 'Are you sure?';
  return Promise.resolve(window.confirm(msg));
};

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
  });

  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === 'string') {
        setDialogState({
          isOpen: true,
          title: 'Confirmation Required',
          message: options,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'danger',
        });
      } else {
        setDialogState({
          isOpen: true,
          title: options?.title || 'Confirmation Required',
          message: options?.message || 'Are you sure you want to continue?',
          confirmText: options?.confirmText || 'Confirm',
          cancelText: options?.cancelText || 'Cancel',
          type: options?.type || 'danger',
        });
      }
    });
  }, []);

  // Expose to global helper
  globalConfirmHandler = confirm;

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  return ctx || confirmAction;
};

export default ConfirmContext;
