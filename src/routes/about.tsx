import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="p-2">
      <h1 className="text-2xl">Hello from About!</h1>
    </div>
  );
}
