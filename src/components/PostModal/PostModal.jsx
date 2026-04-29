import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import styles from "./PostModal.module.scss";

const resolveImage = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const formatRelative = (dateString) => {
  if (!dateString) return "vừa xong";
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày`;
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const TRUNCATE = 120;

const PostModal = ({ post, open, onClose }) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    setExpanded(false);
  }, [post?.id]);

  if (!open || !post) return null;

  const author = post.user || post.user_id || {};
  const pageName =
    post.page_name ||
    author.fullname ||
    [author.first_name, author.last_name].filter(Boolean).join(" ") ||
    author.username ||
    "Tác giả";

  const subAuthor =
    post.sub_author ||
    author.username ||
    [author.first_name, author.last_name].filter(Boolean).join(" ");

  const description = post.description || post.title || "";
  const isLong = description.length > TRUNCATE;
  const visibleText =
    !expanded && isLong ? `${description.slice(0, TRUNCATE)}…` : description;

  const media = (post.media && post.media.length > 0
    ? post.media
    : [post.thumbnail].filter(Boolean)
  ).slice(0, 2);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <FallbackImage
            src={resolveImage(author.avatar)}
            alt={pageName}
            className={styles.avatar}
          />
          <div className={styles.headerMeta}>
            <div className={styles.pageRow}>
              <span className={styles.pageName}>{pageName}</span>
              <svg
                className={styles.verifiedIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-label="verified"
              >
                <path
                  d="M12 2l2.5 1.7 3 .1 1.1 2.8 2.4 1.8-.7 2.9.7 2.9-2.4 1.8-1.1 2.8-3 .1L12 22l-2.5-1.7-3-.1-1.1-2.8L3 15.6l.7-2.9L3 9.8l2.4-1.8 1.1-2.8 3-.1L12 2z"
                  fill="#16a34a"
                />
                <path
                  d="M8.5 12.2l2.4 2.3 4.6-4.7"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.subRow}>
              <span className={styles.subAuthor}>{subAuthor}</span>
              <span className={styles.dot}>·</span>
              <span>{formatRelative(post.published_at)}</span>
              <span className={styles.dot}>·</span>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
                <path
                  d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="Tùy chọn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          <button
            className={styles.iconBtn}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          {description && (
            <div className={styles.caption}>
              <p className={styles.captionText}>
                {visibleText}
                {isLong && !expanded && (
                  <button
                    type="button"
                    className={styles.seeMore}
                    onClick={() => setExpanded(true)}
                  >
                    Xem thêm
                  </button>
                )}
              </p>
            </div>
          )}

          {media.length > 0 && (
            <div
              className={`${styles.mediaGrid} ${
                media.length === 1 ? styles.gridOne : styles.gridTwo
              }`}
            >
              {media.map((src, idx) => (
                <div key={idx} className={styles.mediaCell}>
                  <FallbackImage
                    src={resolveImage(src)}
                    alt={post.title || `media-${idx}`}
                    className={styles.mediaImage}
                  />
                </div>
              ))}
            </div>
          )}

          <footer className={styles.footer}>
            <div className={styles.stats}>
              <span className={styles.reaction}>
                <span className={styles.reactionIcon}>👍</span>
                <span className={styles.reactionIcon}>❤️</span>
                <span className={styles.reactionCount}>
                  {post.likes_count ?? 0}
                </span>
              </span>
              <span className={styles.commentCount}>
                {post.comments_count ?? 0} bình luận
              </span>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.actionBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 00-6 0v4H5l1 11h12l1-11h-3z" strokeLinejoin="round" />
                </svg>
                Thích
              </button>
              <button type="button" className={styles.actionBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinejoin="round" />
                </svg>
                Bình luận
              </button>
              <button type="button" className={styles.actionBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8h16v-8M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Chia sẻ
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

PostModal.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    media: PropTypes.arrayOf(PropTypes.string),
    page_name: PropTypes.string,
    sub_author: PropTypes.string,
    published_at: PropTypes.string,
    likes_count: PropTypes.number,
    comments_count: PropTypes.number,
    user: PropTypes.object,
    user_id: PropTypes.object,
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default PostModal;
