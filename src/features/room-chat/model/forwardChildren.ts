import type { GithubComNarraTableBackendPkgProtocolClueContent } from '@/api/model/githubComNarraTableBackendPkgProtocolClueContent';
import type { GithubComNarraTableBackendPkgProtocolForwardedMessage } from '@/api/model/githubComNarraTableBackendPkgProtocolForwardedMessage';
import type { GithubComNarraTableBackendPkgProtocolVeil } from '@/api/model/githubComNarraTableBackendPkgProtocolVeil';

export type ForwardChild = GithubComNarraTableBackendPkgProtocolForwardedMessage & {
  seq?: number;
  messageId?: string;
  clue?: GithubComNarraTableBackendPkgProtocolClueContent;
  raw?: string;
  veil?: GithubComNarraTableBackendPkgProtocolVeil;
  result?: { error?: string | null };
};

export type ForwardChildView = 'body' | 'omitted' | 'sender-only';

export function orderForwardChildren(children: readonly ForwardChild[]): ForwardChild[] {
  if (!children.some((child) => typeof child.seq === 'number')) return [...children];
  return children
    .map((child, index) => ({ child, index }))
    .sort((left, right) => {
      const leftSeq =
        typeof left.child.seq === 'number' ? left.child.seq : Number.POSITIVE_INFINITY;
      const rightSeq =
        typeof right.child.seq === 'number' ? right.child.seq : Number.POSITIVE_INFINITY;
      if (leftSeq !== rightSeq) return leftSeq - rightSeq;
      return left.index - right.index;
    })
    .map((item) => item.child);
}

function hasClueBody(clue: GithubComNarraTableBackendPkgProtocolClueContent | undefined): boolean {
  if (!clue) return false;
  return Boolean(
    clue.title?.trim() || clue.description?.trim() || clue.imageUrl || clue.tags?.length,
  );
}

export function forwardChildView(child: ForwardChild): ForwardChildView {
  if (child.type === 'forward' && !child.forward) return 'omitted';
  if (child.type === 'clue') return hasClueBody(child.clue) ? 'body' : 'sender-only';
  if (child.type === 'command') return child.raw?.trim() ? 'body' : 'sender-only';
  return child.blocks?.length ? 'body' : 'sender-only';
}

export function messageTypeLabel(type: string | undefined): string {
  if (type === 'clue') return '线索';
  if (type === 'command') return '指令';
  if (type === 'forward') return '合并转发';
  if (type === 'system') return '系统';
  return '发言';
}
