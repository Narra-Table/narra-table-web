/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WindowContent } from './WindowContent';

afterEach(cleanup);

describe('WindowContent', () => {
  it('renders the selected local window', () => {
    render(<WindowContent kind="chat" />);
    expect(screen.getByLabelText('消息')).toBeDefined();

    cleanup();
    render(<WindowContent kind="map" />);
    expect(screen.getByRole('button', { name: '格子 1' })).toBeDefined();
  });
});
