/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CharactersWindow, CluesWindow, MapWindow } from './MockWindows';

afterEach(cleanup);

describe('mock workbench windows', () => {
  it('adds and removes a character', () => {
    render(<CharactersWindow />);
    fireEvent.change(screen.getByLabelText('角色名'), { target: { value: '侦探' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('侦探')).toBeDefined();
    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[1]!);
    expect(screen.queryByText('侦探')).toBeNull();
  });

  it('adds and removes a clue', () => {
    render(<CluesWindow />);
    fireEvent.change(screen.getByLabelText('线索'), { target: { value: '旧钥匙' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('旧钥匙')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(screen.queryByText('旧钥匙')).toBeNull();
  });

  it('toggles a map cell', () => {
    render(<MapWindow />);
    const cell = screen.getByRole('button', { name: '格子 1' });
    fireEvent.click(cell);
    expect(cell.textContent).toBe('•');
  });
});
