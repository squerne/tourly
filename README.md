# Tourly

Tourly is a full-stack, customizable product onboarding tour component system for Next.js 14+ (App Router). It features a polished admin interface for managing tours and steps, complete with database persistence.

## Features

- **Store-backed Tours**: Save your tours and steps into a PostgreSQL database.
- **Extensible Admin Interface**: Manage tours, configure steps, and customize the look and feel.
- **Glassmorphism & Theming**: Robust styling options for beautiful tour cards.

## Setup Instructions

This repository serves as a boilerplate/template to integrate Tourly into your own Next.js application.

### 1. Database Initialization

Tourly requires a PostgreSQL database. Ensure the following environment variable is set in your project's `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"
OPENAI_API_KEY="sk-your-openai-api-key"
```

Run the initialization script `schema.sql` against your database to create the `tours` and `steps` tables.

```bash
psql -U your_user -d your_db -f schema.sql
```

### 2. Copying Files

You can use the provided setup script to easily copy the necessary files into your Next.js project:

```bash
chmod +x setup.sh
./setup.sh /path/to/your/nextjs/project
```

Alternatively, you can manually copy the provided directories:

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

### 4. Integration & Configuration

Wrap your layout with the `TourlyProvider`, fetching the tours from your `tourlyStore`:

```tsx
import { TourlyProvider } from "@/components/tourly/TourlyContext";
import { Tourly } from "@/components/tourly/Tourly";
import { tourlyStore } from "@/lib/tourlyStore";

export default async function RootLayout({ children }) {
  // Fetch active tours. You could also detect the device/locale and pass them.
  const { tours, config } = await tourlyStore.getActiveToursByPage("/");
  
  return (
    <TourlyProvider>
      <Tourly steps={tours} config={config}>
        {children}
      </Tourly>
    </TourlyProvider>
  );
}
```

### 5. Admin Pages

Tourly provides the necessary backend API routes (located in `app/api/tours/`) for managing tours, steps, updating configurations, and tracking progress. 
The actual Admin UI views are meant to be built into your own application's admin dashboard by linking to these routes (e.g., creating a `/admin/tours` page in your app that fetches and mutates data via these endpoints).
