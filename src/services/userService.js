import httpRequest from "../utils/httpRequest";

export const getUserByUserName = async (username) => {
  const result = await httpRequest.get(`/users/${username}`);

  return result;
};

// export const getCurrentUser = async () => {
//   const { data } = await httpRequest.get("/auth/me");
//   console.log(data);

//   return data;
// };

export const editProfile = async (formData) => {
  const result = await httpRequest.put(`/users/edit-profile`, formData);
  return result;
};
export const checkFollower = async (userId) => {
  const result = await httpRequest.get(`/users/follow/${userId}`);

  return result;
};
export const toggleFollower = async (userId) => {
  const result = await httpRequest.post(`/users/follow/${userId}`);
  console.log(result);

  return result;
};
export const getFollowersList = async (userId) => {
  return await httpRequest.get(`/users/${userId}/followers`);
};

export const getFollowingList = async (userId) => {
  return await httpRequest.get(`/users/${userId}/following`);
};
export const searchUsers = async (q) => {
  return await httpRequest.get(`/users/search?q=${encodeURIComponent(q)}`);
};
export const settings = async (data) => {
  const result = await httpRequest.post(`/users/settings`, data);
  return result;
};

export default {
  getUserByUserName,
  toggleFollower,
  editProfile,
  checkFollower,
  getFollowersList,
  getFollowingList,
  searchUsers,
  settings,
};
