# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

This project uses **Bun** as the package manager (see `bun.lock`). Use `bun` instead of `npm` or `yarn` for all commands.

## Commands

### Development
- `bun run dev` - Start development server with HMR at http://localhost:5173
- `bun run typecheck` - Run type generation and TypeScript checking
- `bun run build` - Build for production
- `bun run start` - Start production server from built files

## Architecture

### Framework: React Router v7

This is a full-stack React Router v7 application with:
- **SSR enabled by default** (configurable in `react-router.config.ts`)
- **File-based routing** defined in `app/routes.ts` (not automatic file-system routing)
- Type-safe route definitions using `RouteConfig` from `@react-router/dev/routes`

### Project Structure

```
app/
├── root.tsx          # Root layout with <Outlet>, error boundary, and global metadata
├── routes.ts         # Route configuration - manually define all routes here
├── routes/           # Route components
├── lib/              # Shared utilities
└── app.css           # Global styles (Tailwind entry point)
```

### Routing System

Routes are **explicitly defined** in `app/routes.ts`, not auto-generated from file structure. To add a new route:

1. Create the route component in `app/routes/`
2. Import and register it in `app/routes.ts` using the React Router routing helpers (e.g., `index()`, `route()`, `layout()`)

### TypeScript Configuration

- Path alias: `~/*` maps to `./app/*` (configured in `tsconfig.json`)
- Auto-generated types in `.react-router/types/` (included in tsconfig)
- Type-safe route exports via `Route` from `./+types/{routeName}`

### Styling: shadcn/ui + Tailwind CSS v4

- **shadcn/ui** components configured with "new-york" style
- Components go in `~/components` (alias for `app/components`)
- UI components in `~/components/ui`
- Tailwind config embedded in `app/app.css` (Tailwind v4 style)
- Uses `lucide-react` for icons
- Utilities in `~/lib/utils` (includes `cn()` helper)

To add shadcn components, use the MCP shadcn tools or run `bunx shadcn@latest add [component]`.

### Server-Side Rendering

- SSR is enabled (`ssr: true` in `react-router.config.ts`)
- Route components can export loaders/actions for server-side data fetching
- Use `.server` and `.client` directories for code that should only run on server/client

### Build Output

Production builds create:
```
build/
├── client/    # Static assets for the browser
└── server/    # Server-side code
```

### Vite Plugins

- `@tailwindcss/vite` - Tailwind CSS v4
- `@react-router/dev/vite` - React Router framework
- `vite-tsconfig-paths` - Resolves TypeScript path aliases
- sempre que voce fizer algo, coloque no codigo um mentario foi feito pelo claude sonnet 4.5