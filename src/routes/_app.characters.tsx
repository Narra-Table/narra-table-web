import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/characters')({
  component: CharactersPage,
});

function CharactersPage() {
  return null;
}
