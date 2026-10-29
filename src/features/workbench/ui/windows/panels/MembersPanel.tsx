import { useGetApiSpacesSpaceId } from '@/api';
import { ROLE_LABEL } from '../labels';
import { PanelScroll } from './PanelScroll';

export function MembersPanel({ spaceId }: { spaceId: string }) {
  const space = useGetApiSpacesSpaceId(spaceId, {
    query: { select: (response) => response.data },
  });
  const members = space.data?.members ?? [];
  return (
    <PanelScroll>
      {space.isLoading ? <p className="text-xs text-text-muted">正在读取成员</p> : null}
      {!space.isLoading && members.length === 0 ? (
        <p className="text-sm text-text-muted">还没有成员</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3 rounded-control px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-text">
              {(member.displayName || '成').slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text">
                {member.displayName || '未命名成员'}
              </span>
              <span className="block text-xs text-text-muted">
                {member.role ? ROLE_LABEL[member.role] : '成员'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </PanelScroll>
  );
}
