import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import styles from "./FollowListModal.module.scss";

const resolveAvatar = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const FollowListModal = ({ title, users = [], loading, onClose }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : users.length === 0 ? (
            <div className={styles.empty}>Chưa có ai</div>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.username}`}
                className={styles.userItem}
                onClick={onClose}
              >
                <FallbackImage
                  src={resolveAvatar(u.avatar)}
                  alt={u.username}
                  className={styles.avatar}
                />
                <div className={styles.info}>
                  <span className={styles.name}>
                    {u.fullname || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}
                  </span>
                  <span className={styles.username}>@{u.username}</span>
                  {u.title && <span className={styles.title2}>{u.title}</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

FollowListModal.propTypes = {
  title: PropTypes.string.isRequired,
  users: PropTypes.array,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default FollowListModal;
