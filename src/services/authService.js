import httpRequest from "../utils/httpRequest";

export const register = async (formData) => {
  const data = await httpRequest.post("/auth/register", {
    first_name: formData.first_name,
    last_name: formData.last_name,
    email: formData.email,
    password: formData.password,
  });
  console.log("Register response:", data);
  return data;
};

export const login = async (formData) => {
  const response = await httpRequest.post("/auth/login", {
    email: formData.email,
    password: formData.password,
  });

  if (response.data?.token || response.token) {
    const token = response.data?.token || response.token;

    localStorage.setItem("token", token);

    try {
      const userData = await me();
      return {
        ...response,
        user: userData,
        token: token,
      };
    } catch (error) {
      console.error("Error fetching user data after login:", error);
      return response;
    }
  }

  return response;
};
export const getUser = async () => {
  const result = await httpRequest.get("/auth/me");

  return result;
};

export const me = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found");
    return null;
  }

  try {
    const response = await httpRequest.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data || response;

    return userData;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};

export const forgotPassword = async (formData) => {
  const data = await httpRequest.post("/auth/forgot-password", {
    email: formData.email,
  });
  return data;
};

export const verifyEmail = async (token) => {
  const result = await httpRequest.post(`/auth/verify-email?token=${token}`);

  return result;
};

export const verifyToken = async (token) => {
  const result = await httpRequest.get(`/auth/verify-token?token=${token}`);

  return result;
};

export const resetPassword = async (data) => {
  const result = await httpRequest.post(`/auth/reset-password`, data);
  return result;
};

export default {
  register,
  login,
  forgotPassword,
  resetPassword,
  getUser,
  me,
  verifyEmail,
  verifyToken,
};
