import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import type { OutgoingVeil } from '../model/types';

export function useRoomChatProfile() {
  const [masks, setMasks] = useState<GithubComNarraTableBackendPkgProtocolMask[]>([]);
  const [members, setMembers] = useState<GithubComNarraTableBackendPkgProtocolMember[]>([]);
  const [role, setRole] = useState<GithubComNarraTableBackendPkgProtocolMemberRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [maskId, setMaskId] = useState('');
  const [veil, setVeilState] = useState<OutgoingVeil>('all');
  const maskIdRef = useRef(maskId);
  maskIdRef.current = maskId;

  const canUseGmVeil = role === 'gm' || role === 'agm';
  const canSend = canUseGmVeil || role === 'pl';

  const setVeil = useCallback(
    (next: OutgoingVeil) => {
      if (next === 'gm_only' && !canUseGmVeil) return;
      setVeilState(next);
    },
    [canUseGmVeil],
  );

  useEffect(() => {
    if (canUseGmVeil) return;
    setVeilState('all');
  }, [canUseGmVeil]);

  const usableMasks = useMemo(
    () => masks.filter((mask) => userId !== null && (mask.userIds ?? []).includes(userId)),
    [masks, userId],
  );

  useEffect(() => {
    if (usableMasks.some((mask) => mask.maskId === maskId)) return;
    setMaskId(usableMasks[0]?.maskId ?? '');
  }, [usableMasks, maskId]);

  const maskNames = useMemo(() => new Map(masks.map((mask) => [mask.maskId, mask.name])), [masks]);

  const applyProfile = useCallback(
    (
      id: string,
      nextMembers: GithubComNarraTableBackendPkgProtocolMember[],
      nextMasks: GithubComNarraTableBackendPkgProtocolMask[],
    ) => {
      const member = nextMembers.find((item) => item.userId === id);
      const usable = nextMasks.filter((mask) => (mask.userIds ?? []).includes(id));
      const preferred =
        usable.find((mask) => mask.maskId === member?.maskId) ??
        usable.find((mask) => mask.isDefault) ??
        usable[0];

      setUserId(id);
      setRole(member?.role ?? null);
      setMembers(nextMembers);
      setMasks(nextMasks);
      if (preferred && !maskIdRef.current) maskIdRef.current = preferred.maskId;
      setMaskId((current) => current || preferred?.maskId || '');
    },
    [],
  );

  return {
    masks,
    members,
    role,
    userId,
    maskId,
    maskIdRef,
    setMaskId,
    veil,
    setVeil,
    canSend,
    canUseGmVeil,
    usableMasks,
    maskNames,
    applyProfile,
  };
}
