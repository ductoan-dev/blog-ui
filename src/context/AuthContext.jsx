import { createContext, useContext, useState, useEffect } from "react";
import { me } from "../services/authService";

export const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          const userData = await me();

          if (userData) {
            const processedUser = {
              ...userData,
            };

            setUser(processedUser);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(processedUser));
          } else {
            // Xóa token không hợp lệ
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No token = not signed in; drop any user left over from an old session
          localStorage.removeItem("user");
          localStorage.removeItem("refresh_token");
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, token) => {
    try {
      if (token) {
        localStorage.setItem("token", token);
      }

      const processedUser = {
        ...userData,
      };

      localStorage.setItem("user", JSON.stringify(processedUser));
      setUser(processedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Lỗi khi login:", error);
      throw error;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};
