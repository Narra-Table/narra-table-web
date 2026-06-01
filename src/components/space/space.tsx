import { useSpacesQuery } from './spaceQuery';

export function Space() {
  const { data: spaces = [], isLoading, isError } = useSpacesQuery();

  if (isLoading) {
    return (
      <section className="max-w-2xl">
        <p>Loading spaces...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="max-w-2xl">
        <p>Error occurred while fetching space data.</p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl">
      <h2 className="mb-3 text-base">Mock Space Data</h2>

      <ul className="list-disc space-y-2 pl-5">
        {spaces.map((space) => (
          <li key={space.id}>
            <span>{space.name}</span>
            <span> - {space.system}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
