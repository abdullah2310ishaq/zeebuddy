# Components Directory Structure

This directory contains all reusable React components organized by their purpose and scope.

## Directory Structure

### `/ui`

Basic, reusable UI components (atoms/molecules in Atomic Design)

- Buttons
- Inputs
- Cards
- Badges
- Modals
- Dropdowns
- etc.

**Example:**

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  // Implementation
}
```

### `/layout`

Layout-related components that structure pages

- Header
- Footer
- Sidebar
- Navigation
- Container
- Grid systems

**Example:**

```tsx
// src/components/layout/Header.tsx
export function Header() {
  return <header>{/* Header content */}</header>;
}
```

### `/features`

Feature-specific components (organisms in Atomic Design)

- DashboardWidget
- UserProfile
- ProductCard
- etc.

These components are more complex and may combine multiple UI components.

**Example:**

```tsx
// src/components/features/UserProfile.tsx
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function UserProfile() {
  return <Card>{/* Complex user profile UI */}</Card>;
}
```

## Best Practices

1. **Keep components focused**: Each component should do one thing well
2. **Use TypeScript**: Define proper interfaces for props
3. **Make components reusable**: Avoid hard-coding values, use props
4. **Follow naming conventions**: Use PascalCase for component files
5. **Export named exports**: Prefer named exports over default exports
6. **Document complex components**: Add JSDoc comments for clarity
7. **Keep styling consistent**: Use Tailwind CSS utilities
8. **Make components accessible**: Follow WCAG guidelines

## Importing Components

```tsx
// Import UI components
import { Button } from "@/components/ui/Button";

// Import layout components
import { Header } from "@/components/layout/Header";

// Import feature components
import { UserProfile } from "@/components/features/UserProfile";
```
