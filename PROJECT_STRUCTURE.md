# Zee Admin - Project Structure

## Overview

This is a Next.js 15 application with TypeScript, Tailwind CSS v4, and a modular component architecture designed for pixel-perfect responsive UI development.

## Tech Stack

- **Framework**: Next.js 15.5.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **React**: 19.1.0

## Directory Structure

```
zee-admin/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router (Pages/Routes)
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles
│   │
│   ├── components/        # React components
│   │   ├── ui/           # Basic UI components (buttons, inputs, cards)
│   │   ├── layout/       # Layout components (header, footer, sidebar)
│   │   └── features/     # Feature-specific complex components
│   │
│   ├── lib/              # Utility functions and helpers
│   │   └── utils.ts      # Common utilities (cn, formatters)
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── useMediaQuery.ts  # Responsive design hooks
│   │
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Common types and interfaces
│   │
│   └── constants/        # Application constants
│       └── index.ts      # Routes, breakpoints, configs
│
├── package.json
├── tsconfig.json          # TypeScript configuration
├── next.config.ts         # Next.js configuration
├── postcss.config.mjs     # PostCSS configuration
└── README.md
```

## Component Organization

### `/components/ui`

Atomic, reusable UI components:

- Buttons
- Inputs/Forms
- Cards
- Badges/Tags
- Modals/Dialogs
- Dropdowns/Menus
- Tabs
- Alerts/Toasts

### `/components/layout`

Page structure components:

- Header/AppBar
- Footer
- Sidebar/Navigation
- Container/Wrapper
- Grid systems

### `/components/features`

Business logic components:

- Dashboard widgets
- User profiles
- Data tables
- Charts/Analytics
- Product displays

## Development Workflow

### 1. Pages (Routes)

Create pages in `src/app/` directory:

```tsx
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

### 2. UI Components

Create reusable components in `src/components/ui/`:

```tsx
// src/components/ui/Button.tsx
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg",
        variant === "primary" && "bg-blue-500 text-white",
        variant === "secondary" && "bg-gray-200 text-gray-800"
      )}
    >
      {children}
    </button>
  );
}
```

### 3. Layout Components

Create layout components in `src/components/layout/`:

```tsx
// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="w-full h-16 border-b">{/* Header content */}</header>
  );
}
```

## Best Practices

### 1. Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_URL`)
- **Types**: PascalCase (e.g., `UserProfile`)

### 2. File Organization

- One component per file
- Co-locate related files (component + styles + tests)
- Use index files for clean imports when needed

### 3. Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Maintain consistent spacing using Tailwind's spacing scale

### 4. TypeScript

- Define proper interfaces for all props
- Use type inference where possible
- Avoid `any` type
- Export types for reusability

### 5. Performance

- Use React Server Components by default (Next.js 15)
- Add 'use client' directive only when needed
- Lazy load heavy components
- Optimize images using Next.js Image component

### 6. Accessibility

- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios

## Utility Functions

### `cn()` - Class Name Merger

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />;
```

### Responsive Hooks

```tsx
import { useIsMobile } from "@/hooks/useMediaQuery";

const isMobile = useIsMobile();
```

## Getting Started

1. **Install dependencies**: `npm install`
2. **Run development server**: `npm run dev`
3. **Build for production**: `npm run build`
4. **Start production server**: `npm start`

## Next Steps

1. Receive Figma design images
2. Analyze the design and create detailed component breakdown
3. Implement components following the established structure
4. Test responsiveness across all breakpoints
5. Ensure pixel-perfect implementation

---

**Note**: This structure is designed to scale with your application while maintaining clean separation of concerns and maximum reusability.
