import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/assets/$assetId')({
  component: AssetDetailPage,
});

function AssetDetailPage() {
  return null;
}
