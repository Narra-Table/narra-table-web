import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/modules')({
  component: ModulesPage,
});

function ModulesPage() {
  return null;
}
