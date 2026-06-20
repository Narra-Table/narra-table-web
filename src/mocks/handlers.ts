import {
  getNarratableAPIMock,
  getGetApiMeMockHandler,
  getPostAuthLoginMockHandler,
  getPostAuthRegisterMockHandler,
  getPostAuthSendCodeMockHandler,
} from './index.msw';

const MOCK_USER = {
  nickname: '一只故桌娘',
  username: 'guzhuoniang',
  avatar: '/avatar.webp',
};

const MOCK_AUTH_RESPONSE = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 86400,
  user: MOCK_USER,
};

export const handlers = [
  getPostAuthLoginMockHandler(MOCK_AUTH_RESPONSE),
  getPostAuthRegisterMockHandler(MOCK_AUTH_RESPONSE),
  getPostAuthSendCodeMockHandler(),
  getGetApiMeMockHandler(MOCK_USER),
  ...getNarratableAPIMock(),
];
