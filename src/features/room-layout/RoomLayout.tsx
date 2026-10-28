import { Outlet } from '@tanstack/react-router';

export function RoomLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-app-bg text-text">
      <Outlet />
    </div>
  );
}
