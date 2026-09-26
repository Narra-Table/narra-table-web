import { createFileRoute } from '@tanstack/react-router';
import { useGetApiSpaces } from '@/api';
import { DashboardRightPanel } from '@/features/dashboard/DashboardRightPanel';
import { SpacesContent } from '@/features/dashboard/SpacesContent';

function DashboardPage() {
  const { data: spaces = [] } = useGetApiSpaces({
    query: { select: (response) => response.data.spaces ?? [] },
  });

  return (
    <div className="flex h-full bg-app-bg">
      <SpacesContent />
      <DashboardRightPanel spaceId={spaces[0]?.spaceId} />
    </div>
  );
}

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});
