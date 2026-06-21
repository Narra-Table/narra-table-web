import { createFileRoute } from '@tanstack/react-router';
import { DashboardRightPanel } from '@/features/dashboard/DashboardRightPanel';
import { SpacesContent } from '@/features/dashboard/SpacesContent';

function DashboardPage() {
  return (
    <div className="flex h-full bg-app-bg">
      <SpacesContent />
      <DashboardRightPanel />
    </div>
  );
}

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});
