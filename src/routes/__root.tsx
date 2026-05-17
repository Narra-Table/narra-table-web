import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

const RootLayout = () => (
  <div className="flex min-h-screen">
    <aside className="w-[clamp(72px,24vw,240px)] shrink-0 border-r p-4">
      <nav className="flex flex-col gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </nav>
    </aside>

    <main className="min-w-0 flex-1 p-4">
      <Outlet />
    </main>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
