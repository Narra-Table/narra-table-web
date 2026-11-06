/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppToolbarProvider, useAppToolbar, useAppToolbarContext } from '../hooks/useAppToolbar';
import { AppToolbarControls, AppToolbarSurface } from './AppToolbar';

afterEach(cleanup);

describe('AppToolbarSurface', () => {
  it('renders route defaults and docked contextual content', () => {
    const view = render(<AppToolbarSurface mode="home" />);
    const toolbar = screen.getByRole('contentinfo', { name: '页面工具栏' });
    expect(toolbar.className).toContain('fixed');
    expect(toolbar.className).toContain('hidden');
    expect(toolbar.className).toContain('lg:flex');
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
    expect(screen.getByDisplayValue('新的草稿')).toBeDefined();
  });

  it('keeps Chinese input composition local until the candidate is committed', () => {
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
              value: '',
              onChange: onMessageChange,
            },
            search: {
              label: '搜索聊天记录',
              placeholder: '搜索聊天记录',
              value: '',
              onChange: onSearchChange,
            },
          },
        }}
      />,
    );

    const message = screen.getByRole('textbox', { name: '聊天输入' });
    fireEvent.compositionStart(message);
    fireEvent.change(message, { target: { value: 'zhong' } });
    expect(onMessageChange).not.toHaveBeenCalled();
    expect(message.getAttribute('value')).toBe('zhong');
    fireEvent.compositionEnd(message, { data: '中', target: { value: '中' } });
    expect(onMessageChange).toHaveBeenCalledOnce();
    expect(onMessageChange).toHaveBeenCalledWith('中');

    fireEvent.click(screen.getByRole('button', { name: '搜索聊天记录' }));
    const search = screen.getByRole('searchbox', { name: '搜索聊天记录' });
    fireEvent.compositionStart(search);
    fireEvent.change(search, { target: { value: 'xian' } });
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(search, { data: '线', target: { value: '线' } });
    expect(onSearchChange).toHaveBeenCalledOnce();
    expect(onSearchChange).toHaveBeenCalledWith('线');
  });

  it('updates a toolbar definition without reordering its registration', () => {
    function ChangingToolbar() {
      const [value, setValue] = useState('变化前');
      useAppToolbar({
        content: {
          kind: 'search',
          label: '变化中的工具栏',
          placeholder: '变化中的工具栏',
          value,
          onChange: setValue,
        },
      });
      return <button onClick={() => setValue('变化后')}>更新工具栏</button>;
    }

    function StaticToolbar() {
      useAppToolbar({
        content: {
          kind: 'search',
          label: '固定工具栏',
          placeholder: '固定工具栏',
          value: '固定',
          onChange: vi.fn(),
        },
      });
      return null;
    }

    function ActiveToolbarLabel() {
      const { activeEntry } = useAppToolbarContext();
      const content = activeEntry?.definition.content;
      return <output>{content?.kind === 'search' ? content.label : ''}</output>;
    }

    render(
      <AppToolbarProvider>
        <ChangingToolbar />
        <StaticToolbar />
        <ActiveToolbarLabel />
      </AppToolbarProvider>,
    );

    expect(screen.getByText('固定工具栏')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '更新工具栏' }));
    expect(screen.getByText('固定工具栏')).toBeDefined();
  });
});
