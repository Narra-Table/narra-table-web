import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_room/spaces/$spaceId')({
  component: SpaceWorkspaceLayout,
});

function SpaceWorkspaceLayout() {
  return <Outlet />;
}
