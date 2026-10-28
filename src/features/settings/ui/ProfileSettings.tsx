import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useGetApiMe, usePostAuthLogout, type getApiMeResponseSuccess } from '@/api';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { clearAuth } from '@/lib/authSession';
import { queryClient } from '@/lib/queryClient';

export function ProfileSettings() {
  const navigate = useNavigate();
  const { data: user } = useGetApiMe({
    query: { select: (res) => (res as getApiMeResponseSuccess).data },
  });

  const { mutate: logout, isPending } = usePostAuthLogout({
    mutation: {
      onSettled: () => {
        clearAuth();
        queryClient.clear();
        void navigate({ to: '/login' });
      },
    },
  });

  return (
    <section className="grid gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          <AvatarImage src={user?.avatar || '/avatar.webp'} alt="用户头像" />
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{user?.nickname}</p>
          <p className="mt-2 text-sm text-text-muted">@{user?.username}</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="flex shrink-0 items-center gap-2 rounded-control border border-danger/40 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          登出
        </button>
      </div>
    </section>
  );
}
