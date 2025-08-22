# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a wedding guest planner application built with Next.js, TypeScript, and Tailwind CSS. The project aims to provide a comprehensive wedding guest management tool with features like drag-and-drop reordering, organization-based access, and real-time data persistence using Supabase.

## Development Commands

- `pnpm dev` - Start the development server with Turbopack (NOTE: Do not run this command automatically)
- `pnpm build` - Build the production application with Turbopack
- `pnpm build:sandbox` - Build in sandbox mode (safe to run while dev server is running)
- `pnpm start` - Start the production server
- `pnpm start:sandbox` - Start production server on port 4000 using sandbox build
- `pnpm clean` - Clean all build artifacts (.next, .next-buildcheck, .turbo)
- `pnpm lint` - Run ESLint for code linting

## Important Notes

- **Use sandbox builds**: Always use `pnpm build:sandbox` when testing builds while the dev server is running to prevent ENOENT errors
- Sandbox builds output to `.next-buildcheck` directory to avoid conflicts with dev server
- Use `pnpm clean` to remove all build artifacts when needed

## Tech Stack & Architecture

### Core Technologies

- **Next.js 15.5.0** with App Router and React Server Components
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** with PostCSS
- **shadcn/ui** components (New York style)
- **Lucide React** for icons

### Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components (shadcn/ui components will be in `/components/ui`)
- `/lib` - Utility functions and shared code
- `/instructions` - Project documentation and requirements

### Import Aliases

- `@/*` maps to the project root
- `@/components` for components
- `@/lib` for utilities
- `@/components/ui` for shadcn/ui components

## Database & Authentication

- **Neon Database**: Use Neon (PostgreSQL) for all database operations
- **Neon Auth**: Implement authentication using Neon's capabilities
- **Gateway Pattern**: Set up a gateway integration layer that:
  - Abstracts external service calls
  - Currently implements local/mock functionality
  - Ready for future third-party service integration
  - Follows adapter pattern for easy swapping of implementations

## Key Features to Implement

Based on the PRD, the application needs:

1. **Authentication & Organizations**

   - User signup/login system (using Neon Auth)
   - Organization-based wedding projects
   - Invite code system for collaboration

2. **Guest Management Dashboard**

   - Statistics cards (total, confirmed, per partner)
   - Drag-and-drop guest reordering
   - Inline editing capabilities
   - Customizable partner roles and initials

3. **Guest Properties**

   - Categories (customizable partner assignments)
   - Age groups (Adult, 7 years, 11 years)
   - Food preferences (No restrictions, Vegetarian, Vegan, Gluten-free, Dairy-free)
   - Three-stage confirmation system

4. **Data Persistence**
   - Neon database for real-time sync
   - Local state management for offline resilience
   - Multi-user collaboration support

## UI/UX Guidelines

- Use 8px spacing system throughout
- Indigo primary color scheme with gray neutrals
- All interactive elements need hover states with tooltips
- Mobile-responsive design with touch-friendly buttons
- White cards on light gray background for visual hierarchy
