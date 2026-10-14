import httpRequest from "../utils/httpRequest";

export const getConversations = async () => {
  return await httpRequest.get("/messenger/conversations");
};

export const getMessages = async (conversationId) => {
  return await httpRequest.get(`/messenger/conversations/${conversationId}/messages`);
};

export const sendMessage = async (conversationId, content) => {
  return await httpRequest.post(`/messenger/conversations/${conversationId}/messages`, { content });
};

export const getOrCreateDirect = async (userId) => {
  return await httpRequest.post(`/messenger/conversations/direct/${userId}`);
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateDirect,
};
