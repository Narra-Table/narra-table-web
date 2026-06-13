import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return null;
}
