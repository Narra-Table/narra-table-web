import { createFileRoute } from '@tanstack/react-router';
import { SpacesContent } from '@/features/space-hub';

function DashboardPage() {
  return (
    <div className="h-full bg-app-bg">
      <SpacesContent />
    </div>
  );
}

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});
