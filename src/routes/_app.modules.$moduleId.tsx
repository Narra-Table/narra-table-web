import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/modules/$moduleId')({
  component: ModuleDetailPage,
});

function ModuleDetailPage() {
  return null;
}
