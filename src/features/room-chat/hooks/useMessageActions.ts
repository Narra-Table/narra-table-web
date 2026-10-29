import { useCallback, type MutableRefObject } from 'react';
import {
  deleteApiMessagesMessageId,
  patchApiMessagesMessageId,
  patchApiMessagesMessageIdVeil,
  postApiMessagesMessageIdFold,
  postApiMessagesMessageIdPin,
} from '@/api';
import type { InternalHandlerEditMessageRequest } from '@/api/model/internalHandlerEditMessageRequest';
import type { InternalHandlerUpdateMessageVeilRequest } from '@/api/model/internalHandlerUpdateMessageVeilRequest';
import type { RoomSocket } from '../api/roomSocket';
import type { RoomChatState, reduceRoomChat } from '../model/reduceRoomChat';
import { replaceChatParagraph, type ComposerExport } from '../model/richText';
import { buildSendCommand } from '../model/send';
import type {
  OutgoingVeil,
  PendingMessage,
  RoomMessage,
  StagedReply,
  TextRun,
  VeilDraft,
} from '../model/types';

type RoomChatDispatch = (action: Parameters<typeof reduceRoomChat>[1]) => void;

interface MessageActionsInput {
  roomId: string;
  stateRef: MutableRefObject<RoomChatState>;
  socketRef: MutableRefObject<RoomSocket | null>;
  dispatch: RoomChatDispatch;
  canSend: boolean;
  canUseGmVeil: boolean;
  maskId: string;
  veil: OutgoingVeil;
}

function messageFromResponse(data: unknown): RoomMessage | null {
  if (!data || typeof data !== 'object' || !('messageId' in data)) return null;
  return data as RoomMessage;
}

export function useMessageActions({
  roomId,
  stateRef,
  socketRef,
  dispatch,
  canSend,
  canUseGmVeil,
  maskId,
  veil,
}: MessageActionsInput) {
  const sendWith = useCallback(
    (requestId: string, draft: PendingMessage['draft']) => {
      const command = buildSendCommand({ requestId, roomId, draft });
      const sent = socketRef.current?.send(command) ?? false;
      if (!sent) dispatch({ type: 'rejected', requestId, error: '连接还没准备好' });
    },
    [dispatch, roomId, socketRef],
  );

  const send = useCallback(
    (payload: ComposerExport, reply?: StagedReply) => {
      const trimmed = payload.plain.trim();
      if (!trimmed || !canSend || !maskId) return;
      const requestId = crypto.randomUUID();
      const draft = {
        text: trimmed,
        nodes: payload.command ? undefined : payload.nodes,
        maskId,
        veilVisibility: canUseGmVeil ? veil : 'all',
        reply,
      } as const;
      dispatch({ type: 'submit', pending: { requestId, status: 'pending', draft } });
      sendWith(requestId, draft);
    },
    [canSend, canUseGmVeil, dispatch, maskId, sendWith, veil],
  );

  const retryPending = useCallback(
    (requestId: string) => {
      const current = stateRef.current.pendings.find((item) => item.requestId === requestId);
      if (!current || current.status === 'pending') return;
      const nextRequestId = crypto.randomUUID();
      dispatch({ type: 'retry', requestId, nextRequestId });
      sendWith(nextRequestId, current.draft);
    },
    [dispatch, sendWith, stateRef],
  );

  const pin = useCallback(
    async (message: RoomMessage) => {
      if (!message.messageId) return;
      const response = await postApiMessagesMessageIdPin(message.messageId, {
        pinned: !message.pinned,
      });
      const next = messageFromResponse(response.data);
      if (response.status === 200 && next) dispatch({ type: 'updated', message: next });
    },
    [dispatch],
  );

  const fold = useCallback(
    async (message: RoomMessage) => {
      if (!message.messageId) return;
      const response = await postApiMessagesMessageIdFold(message.messageId, {
        folded: !message.folded,
      });
      const next = messageFromResponse(response.data);
      if (response.status === 200 && next) dispatch({ type: 'updated', message: next });
    },
    [dispatch],
  );

  const edit = useCallback(
    async (messageId: string, nodes: TextRun[]) => {
      const message = stateRef.current.messages.find((item) => item.messageId === messageId);
      if (!message) return;
      const response = await patchApiMessagesMessageId(messageId, {
        content: replaceChatParagraph(
          message.content,
          nodes,
        ) as unknown as InternalHandlerEditMessageRequest['content'],
      });
      const next = messageFromResponse(response.data);
      if (response.status === 200 && next) dispatch({ type: 'updated', message: next });
    },
    [dispatch, stateRef],
  );

  const updateVeil = useCallback(
    async (message: RoomMessage, draft: VeilDraft) => {
      if (!message.messageId) return;
      const needsAudience = draft.visibility === 'custom' || draft.visibility === 'gm_and_custom';
      const response = await patchApiMessagesMessageIdVeil(message.messageId, {
        visibility: draft.visibility,
        visibleTo: needsAudience ? draft.visibleTo : undefined,
        revealOnSpaceClose: draft.revealOnSpaceClose,
      } as InternalHandlerUpdateMessageVeilRequest);
      const next = messageFromResponse(response.data);
      if (response.status === 200 && next) dispatch({ type: 'updated', message: next });
    },
    [dispatch],
  );

  const remove = useCallback(
    async (message: RoomMessage) => {
      if (!message.messageId) return;
      await deleteApiMessagesMessageId(message.messageId);
      dispatch({ type: 'deleted', messageId: message.messageId });
    },
    [dispatch],
  );

  return { send, retryPending, pin, fold, remove, edit, updateVeil };
}
