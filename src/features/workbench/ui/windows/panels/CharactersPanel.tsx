import { useGetApiSpacesSpaceIdMasks, type getApiSpacesSpaceIdMasksResponseSuccess } from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import { useResourceUrl } from '@/features/resources';
import { MASK_SECTIONS } from '../labels';
import { PanelScroll } from './PanelScroll';

export function CharactersPanel({ spaceId }: { spaceId: string }) {
  const masks = useGetApiSpacesSpaceIdMasks(spaceId, {
    query: {
      select: (response) => (response as getApiSpacesSpaceIdMasksResponseSuccess).data.masks ?? [],
    },
  });
  const list = masks.data ?? [];
  return (
    <PanelScroll>
      {masks.isLoading ? <p className="text-xs text-text-muted">正在读取面具</p> : null}
      {!masks.isLoading && list.length === 0 ? (
        <p className="text-sm text-text-muted">还没有面具</p>
      ) : null}
      <div className="flex flex-col gap-4">
        {MASK_SECTIONS.map((section) => {
          const items = list.filter((mask) => mask.type === section.type);
          if (items.length === 0) return null;
          return (
            <section key={section.type} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-text-muted">{section.label}</h3>
              {items.map((mask) => (
                <MaskRow key={mask.maskId} spaceId={spaceId} mask={mask} />
              ))}
            </section>
          );
        })}
      </div>
    </PanelScroll>
  );
}

function MaskRow({
  spaceId,
  mask,
}: {
  spaceId: string;
  mask: GithubComNarraTableBackendPkgProtocolMask;
}) {
  const resourceId = mask.currentAvatarId ? mask.avatars?.[mask.currentAvatarId] : undefined;
  const media = useResourceUrl(spaceId, resourceId);
  return (
    <div className="flex items-center gap-3 rounded-control px-2 py-2">
      <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-surface-muted text-xs font-semibold text-text">
        {media.url ? (
          <img src={media.url} alt="" className="size-full object-cover" />
        ) : (
          mask.name.slice(0, 1)
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{mask.name}</span>
      {mask.isDefault ? <span className="text-xs text-accent">默认</span> : null}
    </div>
  );
}
