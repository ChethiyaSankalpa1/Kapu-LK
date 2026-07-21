import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastNotification = ({ type = 'info', message, onClose, autoClose = true, duration = 4000 }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const styles = {
        success: 'bg-white dark:bg-gray-800 border-l-4 border-green-500',
        error: 'bg-white dark:bg-gray-800 border-l-4 border-red-500',
        warning: 'bg-white dark:bg-gray-800 border-l-4 border-amber-500',
        info: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'
    };

    React.useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right`}>
            <div className={`${styles[type]} rounded-lg shadow-lg p-4 min-w-[320px] max-w-md flex items-start gap-3 transition-all duration-300`}>
                <div className="flex-shrink-0 mt-0.5">
                    {icons[type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;
