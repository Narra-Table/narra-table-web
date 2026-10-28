import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function useResourceUrl(
  spaceId: string,
  resourceId: string | undefined,
): {
  url?: string;
  failed: boolean;
} {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resourceId) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    const token = getAccessToken();
    void fetch(
      `${API_BASE_URL}/api/spaces/${encodeURIComponent(spaceId)}/resources/${encodeURIComponent(resourceId)}/download`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('resource failed');
        const blob = await response.blob();
        const nextUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        objectUrl = nextUrl;
        setFailed(false);
        setUrl(nextUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resourceId, spaceId]);

  return { url, failed };
}
