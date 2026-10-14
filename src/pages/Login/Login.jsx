import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input, Button } from "../../components";
import styles from "./Login.module.scss";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: contextLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      console.log("🔍 Login response:", response);

      // Kiểm tra cấu trúc response từ API
      let userData;

      // Nếu backend trả về { data: { token, refresh_token, ... } }
      if (response.data) {
        userData = response.data;
      } else {
        userData = response;
      }

      if (userData.token) {
        localStorage.setItem("token", userData.token);
        if (userData.refresh_token) {
          localStorage.setItem("refresh_token", userData.refresh_token);
        }

        try {
          // Via httpRequest so it hits the API base URL with the new token
          const user = await authService.me();
          if (!user) throw new Error("Could not load user info");

          contextLogin(user);

          // Nếu remember me được check, lưu user vào localStorage
          if (formData.rememberMe) {
            localStorage.setItem("user", JSON.stringify(user));
            console.log("🔍 Saved to localStorage:", user);
          }
        } catch (error) {
          console.error("❌ Error fetching user info:", error);
          // Nếu không lấy được user info, tạm thời dùng email
          const tempUser = {
            email: formData.email,
            // Thêm các field khác nếu cần
          };
          contextLogin(tempUser);

          if (formData.rememberMe) {
            localStorage.setItem("user", JSON.stringify(tempUser));
          }
        }
      } else {
        throw new Error("No access token received");
      }

      console.log("✅ Login successful");
      // Back to the protected page that sent the user here, if any
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      console.error("❌ Login failed:", error);
      setErrors({
        submit: error.message || "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Sign in to your account to continue reading and engaging with our
          community.
        </p>
      </div>

      {/* Coming from the email verification link */}
      {location.state?.verified && (
        <div className={styles.notice} role="status">
          Email đã được xác thực. Đăng nhập để tiếp tục.
        </div>
      )}

      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="Enter your email"
          required
        />

        {/* Password Field */}
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          placeholder="Enter your password"
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className={styles.formOptions}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Remember me</span>
          </label>

          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className={styles.submitError}>{errors.submit}</div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Social Login */}
      <div className={styles.socialSection}>
        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        <div className={styles.socialButtons}>
          <button className={styles.socialButton} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button className={styles.socialButton} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 0c-6.627 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            Continue with GitHub
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>
          Don&apos;t have an account?{" "}
          <Link to="/register" className={styles.registerLink}>
            Sign up for free
          </Link>
        </p>
      </div>
    </>
  );
};

export default Login;
