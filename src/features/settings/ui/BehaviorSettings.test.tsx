/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSettings } from './BehaviorSettings';

afterEach(cleanup);

describe('BehaviorSettings', () => {
  it('aligns and toggles the edge auto-scroll switch', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <BehaviorSettings edgeAutoScroll={false} onEdgeAutoScrollChange={onChange} />,
    );
    const control = screen.getByRole('switch', { name: '边缘自动滚动' });
    const thumb = control.firstElementChild;

    expect(thumb?.className).toContain('left-0');
    expect(thumb?.className).toContain('translate-x-1');
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<BehaviorSettings edgeAutoScroll onEdgeAutoScrollChange={onChange} />);
    expect(control.firstElementChild?.className).toContain('translate-x-6');
  });
});
