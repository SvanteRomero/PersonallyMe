import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, NotificationType } from '../types';
import { generateId } from '../utils/formatters';
import { DEFAULT_NOTIFICATION_DURATION } from '../utils/constants';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (
        type: NotificationType,
        message: string,
        options?: { duration?: number; persistent?: boolean }
    ) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    success: (message: string) => string;
    error: (message: string) => string;
    warning: (message: string) => string;
    info: (message: string) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((
        type: NotificationType,
        message: string,
        options?: { duration?: number; persistent?: boolean }
    ): string => {
        const id = generateId();
        const duration = options?.duration ?? DEFAULT_NOTIFICATION_DURATION;
        const persistent = options?.persistent ?? false;

        const notification: Notification = {
            id,
            type,
            message,
            duration,
            persistent,
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods
    const success = useCallback((message: string) => {
        return addNotification('success', message);
    }, [addNotification]);

    const error = useCallback((message: string) => {
        return addNotification('error', message, { duration: 8000 });
    }, [addNotification]);

    const warning = useCallback((message: string) => {
        return addNotification('warning', message);
    }, [addNotification]);

    const info = useCallback((message: string) => {
        return addNotification('info', message);
    }, [addNotification]);

    const value: NotificationContextType = {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification(): NotificationContextType {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
