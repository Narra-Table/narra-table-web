import {
  getGetApiSpacesSpaceIdCluesMockHandler,
  getGetApiSpacesSpaceIdCluesResponseMock,
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
  let response = getGetApiSpacesSpaceIdCluesResponseMock();
  for (let attempt = 0; attempt < 20 && !response.clues?.length; attempt += 1) {
    response = getGetApiSpacesSpaceIdCluesResponseMock();
  }
  return response;
}

function getSpaceResponse() {
  let response = getGetApiSpacesSpaceIdResponseMock();
  for (let attempt = 0; attempt < 20 && !response.members?.length; attempt += 1) {
    response = getGetApiSpacesSpaceIdResponseMock();
  }
  return response;
}

function getScenesResponse() {
  let response = getGetApiSpacesSpaceIdRoomsRoomIdScenesResponseMock();
  for (let attempt = 0; attempt < 20 && !response.scenes?.length; attempt += 1) {
    response = getGetApiSpacesSpaceIdRoomsRoomIdScenesResponseMock();
  }
  return response;
}

export const workbenchHandlers = [
  getGetApiSpacesSpaceIdRoomsRoomIdMessagesMockHandler(getMessagesResponse),
  getGetApiSpacesSpaceIdRoomsRoomIdScenesMockHandler(getScenesResponse),
  getGetApiSpacesSpaceIdCluesMockHandler(getCluesResponse),
  getGetApiSpacesSpaceIdMockHandler(getSpaceResponse),
];
