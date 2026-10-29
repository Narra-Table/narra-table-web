import type { GithubComNarraTableBackendPkgProtocolClueContent } from '@/api/model/githubComNarraTableBackendPkgProtocolClueContent';
import type { GithubComNarraTableBackendPkgProtocolEditRecord } from '@/api/model/githubComNarraTableBackendPkgProtocolEditRecord';
import type { RoomBlock } from './types';

export type PreviousBody =
  | { kind: 'blocks'; blocks: RoomBlock[] }
  | { kind: 'clue'; clue: GithubComNarraTableBackendPkgProtocolClueContent }
  | { kind: 'text'; text: string }
  | { kind: 'empty' };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readPreviousRaw(raw: unknown): PreviousBody {
  let value = raw;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return { kind: 'empty' };
    try {
      value = JSON.parse(text) as unknown;
    } catch {
      return { kind: 'text', text };
    }
  }
  if (Array.isArray(value)) return { kind: 'blocks', blocks: value as RoomBlock[] };
  const record = asRecord(value);
  if (
    record &&
    ('title' in record || 'description' in record || 'isDiscovered' in record || 'tags' in record)
  ) {
    return { kind: 'clue', clue: record as GithubComNarraTableBackendPkgProtocolClueContent };
  }
  if (typeof value === 'string') return { kind: 'text', text: value };
  return { kind: 'empty' };
}

export function newestEditRecords<T extends { editTime?: string }>(
  records: readonly T[] | undefined,
): T[] {
  const copy = [...(records ?? [])];
  const timed = copy.every(
    (record) => record.editTime && !Number.isNaN(Date.parse(record.editTime)),
  );
  if (!timed) return copy.reverse();
  return copy.sort(
    (left, right) => Date.parse(right.editTime ?? '') - Date.parse(left.editTime ?? ''),
  );
}

export type EditRecord = GithubComNarraTableBackendPkgProtocolEditRecord;
