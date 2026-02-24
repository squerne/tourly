# Tourly

Tourly is a full-stack, customizable product onboarding tour component system for Next.js 14+ (App Router). It features a polished admin interface for managing tours and steps, complete with database persistence.

## Features

- **Store-backed Tours**: Save your tours and steps into a PostgreSQL database.
- **Extensible Admin Interface**: Manage tours, configure steps, and customize the look and feel.
- **Glassmorphism & Theming**: Robust styling options for beautiful tour cards.

## Setup Instructions

This repository serves as a boilerplate/template to integrate Tourly into your own Next.js application.

### 1. Database Initialization

Tourly relies on PostgreSQL. Run the initialization script `schema.sql` against your database to create the `tours` and `steps` tables.

```bash
psql -U your_user -d your_db -f schema.sql
```

### 2. Copying Files

Copy the provided directories into your Next.js project:

1. **Components**: Copy `components/tourly` into your project's `components` directory.
2. **Lib/Store**: Copy `lib/tourlyStore.ts` to your project's `lib` folder.
3. **API Routes**: Copy `app/api/tours` to `app/api/tours` or `app/api/admin/tours` (depending on your project).
   > **Note**: Be sure to implement your authentication checks inside the API routes as marked by `// TODO: Implement your auth check here`.

### 3. Dependencies

Make sure you have installed standard components and libraries:
- `framer-motion`
- `lucide-react`
- `pg` (for `tourlyStore.ts`)
- Shadcn UI components (if used in the tour components)

### 4. Integration

Wrap your layout with the `Tourly` provider, fetching the tours from your `tourlyStore`:

```tsx
import { TourlyContext } from "@/components/tourly/TourlyContext";

// In your root or app layout:
// Fetch tours from your API or server action and pass them to the context
```
