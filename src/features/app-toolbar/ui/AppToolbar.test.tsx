/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppToolbarControls, AppToolbarSurface } from './AppToolbar';

afterEach(cleanup);

describe('AppToolbarSurface', () => {
  it('renders route defaults and docked contextual content', () => {
    const view = render(<AppToolbarSurface mode="home" />);
    expect(screen.getByRole('contentinfo', { name: '页面工具栏' }).className).toContain('fixed');
    expect(screen.getByLabelText('全局搜索')).toBeDefined();

    view.rerender(<AppToolbarSurface mode="chat" />);
    expect(screen.getByLabelText('聊天输入')).toBeDefined();

    view.rerender(
      <AppToolbarSurface mode="chat" placement="docked">
        <span>窗口工具</span>
      </AppToolbarSurface>,
    );
    expect(screen.getByRole('contentinfo', { name: '页面工具栏' }).className).toContain('bottom-0');
    expect(screen.getByText('窗口工具')).toBeDefined();
  });

  it('renders and dispatches declarative contextual controls', () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <AppToolbarControls
        definition={{
          content: {
            kind: 'search',
            label: '搜索聊天记录',
            placeholder: '搜索「主房间」聊天记录',
            value: '线索',
            onChange,
          },
          menu: {
            label: '添加窗口',
            items: [{ id: 'characters', label: '角色', onSelect }],
          },
        }}
      />,
    );

    const search = screen.getByRole('searchbox', { name: '搜索聊天记录' });
    expect(search.getAttribute('placeholder')).toContain('主房间');
    fireEvent.change(search, { target: { value: '骰子' } });
    expect(onChange).toHaveBeenCalledWith('骰子');

    fireEvent.click(screen.getByRole('button', { name: '清空搜索聊天记录' }));
    expect(onChange).toHaveBeenCalledWith('');

    fireEvent.click(screen.getByRole('button', { name: '添加窗口' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu', { name: '添加窗口' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '添加窗口' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '角色' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('switches chat and search inputs without sharing their state', () => {
    const onMessageChange = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <AppToolbarControls
        definition={{
          content: {
            kind: 'chat-switcher',
            message: {
              label: '聊天输入',
              placeholder: '输入消息',
              value: '保留的草稿',
              onChange: onMessageChange,
            },
            search: {
              label: '搜索聊天记录',
              placeholder: '搜索当前房间聊天记录',
              value: '保留的搜索词',
              onChange: onSearchChange,
            },
          },
        }}
      />,
    );

    const initialMessage = screen.getByRole('textbox', { name: '聊天输入' });
    expect(initialMessage.getAttribute('value')).toBe('保留的草稿');
    expect(screen.queryByRole('searchbox', { name: '搜索聊天记录' })).toBeNull();

    fireEvent.change(initialMessage, { target: { value: '新的草稿' } });
    expect(onMessageChange).toHaveBeenCalledWith('新的草稿');

    fireEvent.click(screen.getByRole('button', { name: '搜索聊天记录' }));
    const search = screen.getByRole('searchbox', { name: '搜索聊天记录' });
    expect(search.getAttribute('value')).toBe('保留的搜索词');
    fireEvent.change(search, { target: { value: '新的搜索词' } });
    expect(onSearchChange).toHaveBeenCalledWith('新的搜索词');
    expect(screen.getByDisplayValue('保留的草稿')).toBeDefined();
  });
});
