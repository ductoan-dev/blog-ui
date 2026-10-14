import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../Button/Button";
import { verifyEmail } from "../../services/authService";
import styles from "./VerifyEmail.module.scss";

const REDIRECT_SECONDS = 3;

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const requestedRef = useRef(false);
  const token = searchParams.get("token");

  useEffect(() => {
    // StrictMode runs effects twice in dev; the token must be sent once
    if (requestedRef.current) return;
    requestedRef.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Liên kết xác thực không hợp lệ.");
      return;
    }

    (async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage(
          typeof err === "string" && err
            ? err
            : "Liên kết đã hết hạn hoặc không hợp lệ."
        );
      }
    })();
  }, [token]);

  const goToLogin = () =>
    navigate("/login", { replace: true, state: { verified: true } });

  // After success, count down then send the user to the login screen
  useEffect(() => {
    if (status !== "success") return;
    if (countdown === 0) {
      goToLogin();
      return;
    }
    const timer = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  });

  if (status === "verifying") {
    return (
      <div className={styles.verify} role="status">
        <div className={styles.spinner} aria-hidden="true" />
        <h1 className={styles.title}>Đang xác thực email</h1>
        <p className={styles.text}>Vui lòng chờ trong giây lát...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.verify}>
        <div className={`${styles.icon} ${styles.success}`}>{ICONS.success}</div>
        <h1 className={styles.title}>Xác thực thành công</h1>
        <p className={styles.text}>
          Email của bạn đã được xác thực. Bạn có thể đăng nhập để bắt đầu viết
          bài.
        </p>
        <Button fullWidth onClick={goToLogin}>
          Đăng nhập ngay
        </Button>
        <p className={styles.hint} aria-live="polite">
          Tự chuyển đến trang đăng nhập sau {countdown}s
        </p>
      </div>
    );
  }

  return (
    <div className={styles.verify}>
      <div className={`${styles.icon} ${styles.error}`}>{ICONS.error}</div>
      <h1 className={styles.title}>Xác thực thất bại</h1>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <Button fullWidth onClick={() => navigate("/login", { replace: true })}>
          Đến trang đăng nhập
        </Button>
        <Link to="/" className={styles.link}>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
