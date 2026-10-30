import { createFileRoute } from '@tanstack/react-router';
import { NotificationPanel, SpacesContent } from '@/features/dashboard';

function DashboardPage() {
  return (
    <div className="flex h-full bg-app-bg">
      <SpacesContent />
      <NotificationPanel />
    </div>
  );
}

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});
