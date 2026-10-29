import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const WorkbenchPage = lazy(() =>
  import('@/features/workbench').then((module) => ({
    default: module.WorkbenchPage,
  })),
);

export const Route = createFileRoute('/_room/spaces/$spaceId/')({
  component: SpaceWorkbenchPage,
});

function SpaceWorkbenchPage() {
  const { spaceId } = Route.useParams();
  return (
    <Suspense fallback={null}>
      <WorkbenchPage key={spaceId} spaceId={spaceId} />
    </Suspense>
  );
}
