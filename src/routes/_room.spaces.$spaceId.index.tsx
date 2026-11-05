import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const SpacePage = lazy(() =>
  import('@/features/space').then((module) => ({
    default: module.SpacePage,
  })),
);

export const Route = createFileRoute('/_room/spaces/$spaceId/')({
  component: SpaceRoutePage,
});

function SpaceRoutePage() {
  const { spaceId } = Route.useParams();
  return (
    <Suspense fallback={null}>
      <SpacePage key={spaceId} spaceId={spaceId} />
    </Suspense>
  );
}
