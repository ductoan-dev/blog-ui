import httpRequest from "../utils/httpRequest";

export const getListTopic = async () => {
  const topics = await httpRequest.get("/topics");

  return topics;
};

export const getById = async (id) => {
  const topic = await httpRequest.get(`/topics/${id}`);
  return topic.data;
};
export const getBySlug = async (slug) => {
  const topic = await httpRequest.get(`/topics/slug/${slug}`);
  console.log(topic.data);

  return topic.data;
};

export const createTopic = async (data) => {
  return await httpRequest.post("/topics", data);
};

export default {
  getListTopic,
  getById,
  getBySlug,
  createTopic,
};
