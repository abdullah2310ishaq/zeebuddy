/**
 * Color constants for the application
 */

export const COLORS = {
    // Gradient colors
    GRADIENT_START: '#C21C15',
    GRADIENT_END: '#4C50D5',

    // Primary colors
    PRIMARY: '#C21C15',
    SECONDARY: '#4C50D5',

    // Status colors
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',

    // Neutral colors
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_50: '#F9FAFB',
    GRAY_100: '#F3F4F6',
    GRAY_200: '#E5E7EB',
    GRAY_300: '#D1D5DB',
    GRAY_400: '#9CA3AF',
    GRAY_500: '#6B7280',
    GRAY_600: '#4B5563',
    GRAY_700: '#374151',
    GRAY_800: '#1F2937',
    GRAY_900: '#111827',
} as const;

/**
 * CSS gradient background
 */
export const BACKGROUND_GRADIENT = `linear-gradient(180deg, ${COLORS.GRADIENT_START} 0%, ${COLORS.GRADIENT_END} 100%)`;

/**
 * Darker gradient for sidebar
 */
export const SIDEBAR_GRADIENT = `linear-gradient(180deg, #A0160F 0%, #3B42B8 100%)`;
