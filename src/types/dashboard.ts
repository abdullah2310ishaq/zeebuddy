/**
 * Dashboard-specific type definitions
 */

export interface MetricCard {
    id: string;
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: string;
    iconColor: string;
}

export interface AutomationItem {
    id: string;
    title: string;
    status: 'running' | 'paused';
    icon: string;
    iconColor: string;
}

export interface DeviceItem {
    id: string;
    name: string;
    status: 'active';
    icon: string;
}

export interface UserProfile {
    id: string;
    name: string;
    location: string;
    avatar: string;
}

export interface PushNotificationState {
    enabled: boolean;
}

export interface Contributor {
    id: string;
    name: string;
    roleOrStat: string;
    avatar: string;
}

export interface DashboardData {
    metrics: MetricCard[];
    pushNotifications: PushNotificationState;
}
