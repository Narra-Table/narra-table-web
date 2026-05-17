# ARCHITECTURE.md

## Project Directory Structure

```text
src/
├── routes/              # TanStack Router file-based routes
├── main.tsx             # Application entry point
├── routeTree.gen.ts     # Auto-generated route tree (DO NOT EDIT)
└── style.css            # Global styles
```

## Technical Stack

- Framework: React 19 (Functional components, Hooks)
- Language: TypeScript 6.0
- Toolchain: Vite+
- Styling: Tailwind CSS v4 (Utility-first)
- UI Components: No library installs; freely search and copy-paste any 2024 Shadcn Registry component source code.
- Routing: TanStack Router (File-based)
- State Management: React Context (Global) + useState
- Server State: TanStack Query
- Icons: `lucide-react` (Do not install other icon packs)
