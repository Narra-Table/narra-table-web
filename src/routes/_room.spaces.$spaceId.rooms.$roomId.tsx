import { createFileRoute, redirect } from '@tanstack/react-router';
import { primeWorkbenchRoom } from '@/features/workbench';

// 兼容旧房间链接：把指定房间写入工作台偏好，再跳到空间工作台。
export const Route = createFileRoute('/_room/spaces/$spaceId/rooms/$roomId')({
  beforeLoad: ({ params }) => {
    primeWorkbenchRoom(params.spaceId, params.roomId);
    throw redirect({ to: '/spaces/$spaceId', params: { spaceId: params.spaceId } });
  },
});
