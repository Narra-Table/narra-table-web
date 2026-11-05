/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PersistentToolbarSurface, resolvePersistentToolbarMode } from './PersistentToolbar';

afterEach(cleanup);

describe('PersistentToolbar', () => {
  it('selects content from the current product page', () => {
    expect(resolvePersistentToolbarMode('/')).toBe('home');
    expect(resolvePersistentToolbarMode('/spaces/space-1')).toBe('chat');
    expect(resolvePersistentToolbarMode('/message')).toBe('chat');
    expect(resolvePersistentToolbarMode('/login')).toBe('hidden');
  });

  it('renders home and chat tools inside one persistent surface', () => {
    const view = render(<PersistentToolbarSurface mode="home" />);
    expect(screen.getByRole('contentinfo', { name: '页面工具栏' }).className).toContain('fixed');
    expect(screen.getByLabelText('全局搜索')).toBeDefined();
    expect(screen.getByRole('button', { name: '提醒' })).toBeDefined();

    view.rerender(<PersistentToolbarSurface mode="chat" />);
    expect(screen.getByLabelText('聊天输入')).toBeDefined();
    expect(screen.getByRole('button', { name: '发送消息' })).toBeDefined();

    view.rerender(<PersistentToolbarSurface mode="chat" placement="docked" />);
    expect(screen.getByRole('contentinfo', { name: '页面工具栏' }).className).toContain('bottom-0');
  });
});
