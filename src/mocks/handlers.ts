import { getNarratableAPIMock, getGetApiMeMockHandler } from './index.msw';

export const handlers = [
  getGetApiMeMockHandler({
    nickname: '一只故桌娘',
    username: 'guzhuoniang',
    avatar: '/avatar.webp',
  }),
  ...getNarratableAPIMock(),
];
