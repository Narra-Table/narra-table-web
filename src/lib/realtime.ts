import type { InternalHandlerWSCommandDoc, InternalHandlerWSEventDoc } from '@/api/model';
import { getAccessToken } from './auth';

export type RealtimeStatus = 'idle' | 'connecting' | 'authenticated' | 'reconnecting' | 'closed';
export type RealtimeEvent = InternalHandlerWSEventDoc;

type EventListener = (event: RealtimeEvent) => void;
type PendingRequest = {
  resolve: (event: RealtimeEvent) => void;
  reject: (error: Error) => void;
};

function getWebSocketUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
  if (!configured) {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  }
  const origin = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  return origin.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
}

function createRequestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private manuallyClosed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private cursor = { instanceId: '', eventSeq: 0 };
  private readonly listeners = new Set<EventListener>();
  private readonly pending = new Map<string, PendingRequest>();
  private authPromise: Promise<void> | null = null;
  private resolveAuth: (() => void) | null = null;
  private rejectAuth: ((error: Error) => void) | null = null;
  private _status: RealtimeStatus = 'idle';
  private statusListener: ((status: RealtimeStatus) => void) | null = null;

  get status(): RealtimeStatus {
    return this._status;
  }

  onEvent(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (status: RealtimeStatus) => void): () => void {
    this.statusListener = listener;
    listener(this._status);
    return () => {
      if (this.statusListener === listener) this.statusListener = null;
    };
  }

  async connect(): Promise<void> {
    if (this._status === 'authenticated' && this.socket) return;
    if (this.authPromise) return this.authPromise;
    this.manuallyClosed = false;
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    this.authPromise = new Promise<void>((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;
      const socket = new WebSocket(getWebSocketUrl());
      this.socket = socket;
      socket.addEventListener('open', () => {
        const command: InternalHandlerWSCommandDoc = {
          type: 'auth',
          accessToken: getAccessToken() ?? '',
          instanceId: this.cursor.instanceId || undefined,
          eventSeq: this.cursor.eventSeq || undefined,
        };
        socket.send(JSON.stringify(command));
      });
      socket.addEventListener('message', (message) => this.handleMessage(message.data));
      socket.addEventListener('error', () => {
        this.rejectAuth?.(new Error('WebSocket connection failed'));
      });
      socket.addEventListener('close', () => this.handleClose());
    }).finally(() => {
      this.authPromise = null;
      this.resolveAuth = null;
      this.rejectAuth = null;
    });
    return this.authPromise;
  }

  async sendMessage(
    command: Omit<InternalHandlerWSCommandDoc, 'type' | 'requestId'>,
  ): Promise<RealtimeEvent> {
    await this.connect();
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    const requestId = createRequestId();
    const result = new Promise<RealtimeEvent>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ ...command, type: 'message.send', requestId }));
    return result;
  }

  close(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.pending.forEach(({ reject }) => reject(new Error('WebSocket closed')));
    this.pending.clear();
    this.socket?.close();
    this.socket = null;
    this.setStatus('closed');
  }

  private handleMessage(raw: unknown): void {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(String(raw)) as RealtimeEvent;
    } catch {
      return;
    }
    if (event.instanceId) this.cursor.instanceId = event.instanceId;
    if (event.eventSeq) this.cursor.eventSeq = Math.max(this.cursor.eventSeq, event.eventSeq);

    if (event.type === 'auth.result') {
      if (event.auth?.success) {
        this.reconnectAttempt = 0;
        this.setStatus('authenticated');
        this.resolveAuth?.();
      } else {
        this.manuallyClosed = true;
        this.socket?.close();
        this.setStatus('closed');
        this.rejectAuth?.(
          new Error(event.auth?.error?.message ?? 'WebSocket authentication failed'),
        );
      }
    }
    if (event.requestId && this.pending.has(event.requestId)) {
      const request = this.pending.get(event.requestId);
      this.pending.delete(event.requestId);
      if (event.type === 'message.rejected')
        request?.reject(new Error(event.error?.message ?? 'Message rejected'));
      else request?.resolve(event);
    }
    this.listeners.forEach((listener) => listener(event));
  }

  private handleClose(): void {
    this.socket = null;
    this.pending.forEach(({ reject }) => reject(new Error('WebSocket connection closed')));
    this.pending.clear();
    if (this._status === 'connecting' || this._status === 'reconnecting') {
      this.rejectAuth?.(new Error('WebSocket closed before authentication'));
    }
    if (this.manuallyClosed) return;
    this.setStatus('reconnecting');
    const delay = Math.min(5000, 500 * 2 ** this.reconnectAttempt++);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch(() => undefined);
    }, delay);
  }

  private setStatus(status: RealtimeStatus): void {
    this._status = status;
    this.statusListener?.(status);
  }
}
