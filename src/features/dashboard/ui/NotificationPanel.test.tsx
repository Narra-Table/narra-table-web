/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NotificationPanel } from './NotificationPanel';

afterEach(cleanup);

describe('notification panel', () => {
  it('marks individual notifications as read', () => {
    render(<NotificationPanel />);

    expect(screen.getByText('3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /未读：林澈邀请你加入空间/ }));

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByRole('button', { name: /已读：林澈邀请你加入空间/ })).toBeTruthy();
  });

  it('marks every notification as read', () => {
    render(<NotificationPanel />);

    fireEvent.click(screen.getByRole('button', { name: '全部标记为已读' }));

    expect(screen.queryByText('3')).toBeNull();
    expect(
      (screen.getByRole('button', { name: '全部标记为已读' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('collapses and expands from the menu button', () => {
    render(<NotificationPanel />);

    fireEvent.click(screen.getByRole('button', { name: '收起信息栏' }));

    expect(screen.queryByText('林澈邀请你加入空间')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '展开信息栏' }));

    expect(screen.getByText('林澈邀请你加入空间')).toBeTruthy();
  });
});
