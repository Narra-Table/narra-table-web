import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/characters/$characterId')({
  component: CharacterDetailPage,
});

function CharacterDetailPage() {
  return null;
}
