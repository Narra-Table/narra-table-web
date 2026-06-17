import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/assets')({
  component: AssetsPage,
});

function AssetsPage() {
  return null;
}
