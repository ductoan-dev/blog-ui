import httpRequest from "../utils/httpRequest";

export const getList = async () => {
  const posts = await httpRequest.get("/posts");
  return posts;
};
export const getAllByMe = async () => {
  const posts = await httpRequest.get("/posts/me");

  return posts;
};

export const getByUserName = async (username) => {
  const result = await httpRequest.get(`/posts/user/${username}`);
  return result;
};
export const getListTopicById = async (topicId) => {
  const post = await httpRequest.get(`/posts/topic/${topicId}`);
  console.log(post);

  return post.data;
};
export const getBySlug = async (slug) => {
  const post = await httpRequest.get(`/posts/slug/${slug}`);

  return post;
};
export const toggleBookmarkPost = async (id) => {
  const result = await httpRequest.post(`/bookmarks/${id}`);
  return result;
};
export const toggleLikePost = async (id) => {
  const result = await httpRequest.post(`/posts/${id}/like`);
  return result;
};
export const getListByUserBookmarks = async () => {
  const result = await httpRequest.get(`/posts/user/bookmarks`);
  console.log(result);

  return result;
};
export const getRelatedPosts = async (currentPostId) => {
  const result = await httpRequest.get(`/posts/${currentPostId}/related`);
  return result.data;
};

export const create = async (data) => {
  const post = await httpRequest.post("/posts", data);
  console.log(post);

  return post.data;
};
export const update = async (id, data) => {
  const post = await httpRequest.put(`/posts/${id}`, data);

  return post.data;
};

export const remove = async (id) => {
  const post = await httpRequest.remove(`/posts/${id}`);

  return post.data;
};
export const updateViews = async (id) => {
  const result = await httpRequest.post(`/posts/views/${id}`);
  return result;
};

export default {
  getList,
  getAllByMe,
  getListTopicById,
  getListByUserBookmarks,
  getByUserName,
  getBySlug,
  getRelatedPosts,
  toggleBookmarkPost,
  toggleLikePost,
  create,
  update,
  remove,
  updateViews,
};
