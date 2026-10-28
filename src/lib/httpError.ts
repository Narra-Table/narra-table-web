export type AuthScope = 'user' | 'admin';

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly authScope?: AuthScope;

  constructor(message: string, status: number, body?: unknown, authScope?: AuthScope) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
    this.authScope = authScope;
  }
}
