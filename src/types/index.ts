/**
 * Common TypeScript types and interfaces for the application
 */

export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
}

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
    error?: string;
}

export type Status = "idle" | "loading" | "success" | "error";

export interface PaginationParams {
    page: number;
    limit: number;
    total?: number;
}

// Re-export dashboard types
export * from './dashboard';

