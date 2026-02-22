/**
 * Application constants and configuration values
 */

export const APP_NAME = "Zee Admin";

export const ROUTES = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    LOGIN: "/login",
    REGISTER: "/register",
} as const;

// Breakpoints matching Tailwind CSS defaults
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

// Common animation durations in milliseconds
export const ANIMATION_DURATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

// Re-export other constants
export * from './colors';
export * from './menu';

