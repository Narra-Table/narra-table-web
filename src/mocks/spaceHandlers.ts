import {
  getGetApiSpacesSpaceIdCluesMockHandler,
  getGetApiSpacesSpaceIdCluesResponseMock,
  getGetApiSpacesSpaceIdMasksMockHandler,
  getGetApiSpacesSpaceIdMasksResponseMock,
  getGetApiSpacesSpaceIdResponseMock,
  getGetApiSpacesSpaceIdMockHandler,
  getGetApiSpacesSpaceIdRoomsRoomIdMessagesMockHandler,
  getGetApiSpacesSpaceIdRoomsRoomIdMessagesResponseMock,
  getGetApiSpacesSpaceIdRoomsRoomIdScenesMockHandler,
  getGetApiSpacesSpaceIdRoomsRoomIdScenesResponseMock,
} from './index.msw';

function getMessagesResponse() {
  let response = getGetApiSpacesSpaceIdRoomsRoomIdMessagesResponseMock();
  for (let attempt = 0; attempt < 20 && !response.messages?.length; attempt += 1) {
    response = getGetApiSpacesSpaceIdRoomsRoomIdMessagesResponseMock();
  }
  return response;
}

function getCluesResponse() {
  return getGetApiSpacesSpaceIdCluesResponseMock({
    clues: [
      {
        messageId: 'clue-library-key',
        type: 'clue',
        clue: {
          title: '图书馆的黄铜钥匙',
          description: '钥匙齿痕与旧宅地下室的门锁吻合。',
          isDiscovered: true,
          tags: ['旧宅', '地下室'],
        },
      },
      {
        messageId: 'clue-torn-letter',
        type: 'clue',
        clue: {
          title: '被撕去落款的信',
          description: '信纸带有海水气味，最后一行只剩下一个日期。',
          isDiscovered: true,
          tags: ['码头', '信件'],
        },
      },
      {
        messageId: 'clue-sealed-room',
        type: 'clue',
        clue: {
          title: '封闭房间',
          description: '尚未有人找到进入房间的方法。',
          isDiscovered: false,
          tags: ['未解'],
        },
      },
    ],
  });
}

function getMasksResponse() {
  const timestamp = '2026-11-06T12:00:00+08:00';
  return getGetApiSpacesSpaceIdMasksResponseMock({
    masks: [
      {
        maskId: 'mask-luo-yu',
        spaceId: 'mock-space',
        name: '洛羽',
        type: 'character',
        characterCards: ['card-luo-yu'],
        isDefault: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        maskId: 'mask-chen-mo',
        spaceId: 'mock-space',
        name: '陈默',
        type: 'character',
        characterCards: ['card-chen-mo'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        maskId: 'mask-curator',
        spaceId: 'mock-space',
        name: '守馆人',
        type: 'npc',
        characterCards: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        maskId: 'mask-gm',
        spaceId: 'mock-space',
        name: '讲述者',
        type: 'gm',
        characterCards: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  });
}

function getSpaceResponse() {
  let response = getGetApiSpacesSpaceIdResponseMock();
  for (let attempt = 0; attempt < 20 && !response.members?.length; attempt += 1) {
    response = getGetApiSpacesSpaceIdResponseMock();
  }
  return response;
}

function getScenesResponse() {
  return getGetApiSpacesSpaceIdRoomsRoomIdScenesResponseMock({
    scenes: [
      { messageId: 'scene-gate', label: '大门', position: '0' },
      { messageId: 'scene-hall', label: '大厅', position: '1' },
      { messageId: 'scene-stairs', label: '楼梯', position: '2' },
    ],
  });
}

export const spaceHandlers = [
  getGetApiSpacesSpaceIdRoomsRoomIdMessagesMockHandler(getMessagesResponse),
  getGetApiSpacesSpaceIdMasksMockHandler(getMasksResponse),
  getGetApiSpacesSpaceIdRoomsRoomIdScenesMockHandler(getScenesResponse),
  getGetApiSpacesSpaceIdCluesMockHandler(getCluesResponse),
  getGetApiSpacesSpaceIdMockHandler(getSpaceResponse),
];
