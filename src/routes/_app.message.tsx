import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/message')({
  component: MessagePage,
});

function MessagePage() {
  return null;
}
