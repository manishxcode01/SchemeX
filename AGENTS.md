# SchemeX

React + Vite + Tailwind CSS frontend with an Express + SQLite backend.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `index.html` - Vite HTML shell containing the `#root` element
- `src/main.tsx` - React entrypoint; mounts `src/App.tsx`
- `src/App.tsx` - Primary application component and API hydration boundary
- `src/data/` - Shared scheme/profile model and frontend API client
- `src/pages/` - User and admin screens
- `server/index.ts` - Express API and SQLite database initialization
- `server/data/` - Runtime SQLite database files
- `package.json` - Dependencies and full-stack scripts
- `vite.config.ts` - Vite, Tailwind, Figma Make, and `/api` proxy configuration
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.
