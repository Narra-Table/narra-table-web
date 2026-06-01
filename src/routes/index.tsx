import { createFileRoute } from '@tanstack/react-router';
import { Space } from '@/components/space/space.tsx';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h1 className="text-2xl mb-4">Hello, Narra Table! </h1>
      <Space />
    </div>
  );
}
