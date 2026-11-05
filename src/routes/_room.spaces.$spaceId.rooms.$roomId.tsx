import { createFileRoute, redirect } from '@tanstack/react-router';

// 兼容旧房间链接：直接跳到空间工作台。
export const Route = createFileRoute('/_room/spaces/$spaceId/rooms/$roomId')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/spaces/$spaceId', params: { spaceId: params.spaceId } });
  },
});
