/**
 * Navigation menu constants
 */

export interface MenuItem {
    id: string;
    label: string;
    icon: string;
    isActive?: boolean;
    href?: string;
}

export const MAIN_MENU_ITEMS: MenuItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        isActive: false,
        href: '/dashboard',
    },
    {
        id: 'content-management',
        label: 'Content Management',
        icon: 'content',
        isActive: false,
        href: '/content-management',
    },
    {
        id: 'local-business',
        label: 'Local Business',
        icon: 'business',
        href: '/local-business',
    },
    {
        id: 'user-generated',
        label: 'User Generated',
        icon: 'users',
        href: '/user-generated',
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: 'content',
        href: '/reports',
    },
    {
        id: 'push-notification',
        label: 'Push Notification',
        icon: 'notification',
        href: '/push-notification',
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        href: '/settings',
    },
] as const;

export const HELP_CENTER = {
    title: 'Help Center',
    description: 'Having Trouble in Learning. Please contact us for more questions.',
    buttonText: 'Go To Help Center',
    href: '/help-center',
} as const;
