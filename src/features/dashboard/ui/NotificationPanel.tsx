import {
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Menu,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  mockNotifications,
  type DashboardNotification,
  type DashboardNotificationKind,
} from '../model/mockNotifications';

const notificationIcons: Record<DashboardNotificationKind, LucideIcon> = {
  invite: ArrowRight,
  mention: MessageSquare,
  session: Calendar,
  system: FileText,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: DashboardNotification;
  onRead: () => void;
}) {
  const Icon = notificationIcons[notification.kind];

  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={onRead}
        className="group flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-muted"
        aria-label={`${notification.read ? '已读' : '未读'}：${notification.title}`}
      >
        <span className="relative grid size-9 shrink-0 place-items-center bg-surface-muted text-accent">
          <Icon className="icon-stroke size-4" aria-hidden="true" />
          {!notification.read ? (
            <span className="absolute right-0 top-0 size-2 bg-accent ring-2 ring-surface" />
          ) : null}
        </span>
        <span className={notification.read ? 'min-w-0 opacity-55' : 'min-w-0'}>
          <span className="block text-sm font-medium leading-snug text-text">
            {notification.title}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-muted">
            {notification.detail}
          </span>
          <span className="mt-2 block text-2xs text-text-muted">{notification.time}</span>
        </span>
      </button>
    </li>
  );
}

export function NotificationPanel() {
  const [open, setOpen] = useState(true);
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function markRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  if (!open) {
    return (
      <aside
        className="hidden w-12 shrink-0 border-l border-border-subtle bg-surface xl:flex xl:flex-col"
        aria-label="已收起的信息栏"
      >
        <div className="flex h-14 items-center justify-center border-b border-border-subtle">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-8 place-items-center text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            aria-label="展开信息栏"
            title="展开信息栏"
          >
            <Menu className="icon-stroke size-4" aria-hidden="true" />
          </button>
        </div>
        {unreadCount > 0 ? (
          <span
            className="mt-3 text-center text-xs font-semibold text-accent"
            aria-label={`${unreadCount} 条未读`}
          >
            {unreadCount}
          </span>
        ) : null}
      </aside>
    );
  }

  return (
    <aside
      className="hidden w-72 shrink-0 border-l border-border-subtle bg-surface xl:flex xl:flex-col"
      aria-label="信息栏"
    >
      <header className="flex h-14 items-center border-b border-border-subtle px-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid size-8 place-items-center text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          aria-label="收起信息栏"
          title="收起信息栏"
        >
          <Menu className="icon-stroke size-4" aria-hidden="true" />
        </button>
        {unreadCount > 0 ? (
          <span
            className="ml-2 text-xs font-semibold text-accent"
            aria-label={`${unreadCount} 条未读`}
          >
            {unreadCount}
          </span>
        ) : null}
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="ml-auto grid size-8 place-items-center text-accent transition-opacity hover:bg-surface-muted disabled:cursor-default disabled:opacity-30"
          aria-label="全部标记为已读"
          title="全部标记为已读"
        >
          <Check className="icon-stroke size-4" aria-hidden="true" />
        </button>
      </header>

      <ul className="scroll-subtle-native-hidden flex-1 overflow-y-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={() => markRead(notification.id)}
          />
        ))}
      </ul>
    </aside>
  );
}
