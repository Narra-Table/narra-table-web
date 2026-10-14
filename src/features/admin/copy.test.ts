import { describe, expect, it } from 'vitest';
import { AdminApiError } from '@/lib/adminClient';
import { adminErrorMessage, availableUserActions } from './copy';

describe('availableUserActions', () => {
  it('offers disable, reset, and anonymize for an active account', () => {
    expect(availableUserActions('active')).toEqual(['disable', 'temporaryPassword', 'anonymize']);
  });

  it('offers restore instead of disable for a disabled account', () => {
    expect(availableUserActions('disabled')).toEqual(['restore', 'temporaryPassword', 'anonymize']);
  });

  it('offers nothing after anonymization', () => {
    expect(availableUserActions('deleted')).toEqual([]);
  });
});

describe('adminErrorMessage', () => {
  it('translates known administrator errors', () => {
    expect(adminErrorMessage(new AdminApiError('invalid username or password', 401))).toBe(
      '用户名或密码错误',
    );
  });

  it('keeps unknown API messages', () => {
    expect(adminErrorMessage(new AdminApiError('desk is full', 409, 'conflict'))).toBe(
      'desk is full',
    );
  });
});
