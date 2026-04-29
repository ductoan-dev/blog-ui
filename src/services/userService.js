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
export const settings = async (data) => {
  const result = await httpRequest.post(`/users/settings`, data);
  console.log(result);

  return result;
};
export default {
  getUserByUserName,
  toggleFollower,
  // getCurrentUser,
  editProfile,
  checkFollower,
  settings,
};
