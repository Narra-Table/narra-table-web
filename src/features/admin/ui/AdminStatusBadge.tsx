import { Badge } from '@/components/ui/badge';
import type { AdminUserStatus } from '../api/adminClient';
import { statusLabel } from '../model/copy';

export function AdminStatusBadge({ status }: { status: AdminUserStatus }) {
  const variant = status === 'active' ? 'success' : status === 'disabled' ? 'warning' : 'neutral';
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}
