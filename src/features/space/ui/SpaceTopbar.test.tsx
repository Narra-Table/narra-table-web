/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpaceTopbar } from './SpaceTopbar';

afterEach(cleanup);

describe('SpaceTopbar', () => {
  it('keeps navigation on the left and window creation on the right', () => {
    const onBack = vi.fn();
    const onAddWindow = vi.fn();
    const onFocusWindow = vi.fn();
    render(
      <SpaceTopbar
        windows={[
          { instanceId: 'win-1', title: '聊天' },
          { instanceId: 'win-2', title: '地图' },
        ]}
        focusedWindowId="win-2"
        visibleWindowIds={['win-1']}
        onBack={onBack}
        onAddWindow={onAddWindow}
        onFocusWindow={onFocusWindow}
      />,
    );

    const back = screen.getByRole('button', { name: '返回空间列表' });
    const add = screen.getByRole('button', { name: '添加窗口' });
    const tabs = screen.getByRole('tablist', { name: '窗口' });
    expect(back.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tabs.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const focusedTab = screen.getByRole('tab', { name: '地图' });
    const visibleTab = screen.getByRole('tab', { name: '聊天' });
    expect(focusedTab.getAttribute('aria-selected')).toBe('true');
    expect(focusedTab.firstElementChild?.className).toContain('h-2.5');
    expect(focusedTab.firstElementChild?.className).toContain('bg-border');
    expect(visibleTab.firstElementChild?.className).toContain('h-2.5');
    expect(visibleTab.firstElementChild?.className).toContain('bg-text');

    fireEvent.click(visibleTab);
    expect(onFocusWindow).toHaveBeenCalledWith('win-1');

    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();

    fireEvent.click(add);
    expect(screen.getByRole('menu', { name: '新增窗口' })).toBeDefined();
    fireEvent.click(screen.getByRole('menuitem', { name: '线索' }));
    expect(onAddWindow).toHaveBeenCalledWith('clues');
    expect(screen.queryByRole('menu', { name: '新增窗口' })).toBeNull();
  });
});
