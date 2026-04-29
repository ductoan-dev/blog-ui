import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import styles from "./FacebookSidebar.module.scss";

const resolveImage = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const deriveName = (user) =>
  user?.fullname ||
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.username ||
  "Người dùng";

const ICONS = {
  friends: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="4" fill="#2563eb" />
      <path d="M1 21c0-4 3.6-7 8-7s8 3 8 7" fill="#2563eb" />
      <circle cx="17" cy="9" r="3" fill="#60a5fa" />
      <path d="M14 21c0-3 2-5 5-5s5 2 5 5" fill="#60a5fa" />
    </svg>
  ),
  groups: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2563eb" opacity="0.15" />
      <circle cx="9" cy="11" r="3" fill="#2563eb" />
      <circle cx="15" cy="11" r="3" fill="#60a5fa" />
      <path d="M4 19c1-3 4-4 7-4s6 1 7 4" stroke="#2563eb" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  memories: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="2" fill="#dbeafe" />
      <path d="M12 7v5l3 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  saved: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4V3z" fill="#a855f7" />
    </svg>
  ),
  reels: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#ef4444" />
      <path d="M10 9l5 3-5 3V9z" fill="#fff" />
    </svg>
  ),
  marketplace: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8l2-4h14l2 4v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0V8z" fill="#0ea5e9" />
      <path d="M5 11v9h14v-9" stroke="#0369a1" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  feed: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#2563eb" opacity="0.15" />
      <rect x="6" y="7" width="12" height="2" fill="#2563eb" />
      <rect x="6" y="11" width="12" height="2" fill="#2563eb" />
      <rect x="6" y="15" width="8" height="2" fill="#2563eb" />
    </svg>
  ),
  more: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#e5e7eb" />
      <path d="M8 11l4 4 4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
};

const DEFAULT_MENU = [
  { key: "friends", label: "Bạn bè", to: "#" },
  { key: "groups", label: "Nhóm", to: "#" },
  { key: "memories", label: "Kỷ niệm", to: "#" },
  { key: "saved", label: "Đã lưu", to: "/bookmarks" },
  { key: "reels", label: "Thước phim", to: "#" },
  { key: "marketplace", label: "Marketplace", to: "#" },
  { key: "feed", label: "Bảng feed", to: "/" },
  { key: "more", label: "Xem thêm", to: "#" },
];

// const DEFAULT_SHORTCUTS = [
//   {
//     id: 1,
//     name: "Giao Lưu Cầu Lông Hà Nội ✅",
//     cover:
//       "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=80&h=80&fit=crop",
//   },
//   {
//     id: 2,
//     name: "TÌM ĐỐI TÁC BÓNG ĐÁ SÂN 7 - HÀ NỘI ( KHU VỰC CẦU GIẤY - MỸ ĐÌNH )",
//     cover:
//       "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=80&h=80&fit=crop",
//   },
// ];

const FacebookSidebar = ({
  user,
  menu = DEFAULT_MENU,
  // shortcuts = DEFAULT_SHORTCUTS,
  className,
}) => {
  const name = deriveName(user);

  return (
    <aside className={`${styles.sidebar} ${className || ""}`}>
      <nav className={styles.menu}>
        <Link
          to={user?.username ? `/profile/${user.username}` : "#"}
          className={styles.menuItem}
        >
          <FallbackImage
            src={resolveImage(user?.avatar)}
            alt={name}
            className={styles.avatar}
          />
          <span className={styles.label}>{name}</span>
        </Link>

        {menu.map((item) => (
          <Link key={item.key} to={item.to} className={styles.menuItem}>
            <span className={styles.icon}>{ICONS[item.key]}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* {shortcuts?.length > 0 && (
        <div className={styles.shortcuts}>
          <h3 className={styles.shortcutsTitle}>Lối tắt của bạn</h3>
          <ul className={styles.shortcutList}>
            {shortcuts.map((item) => (
              <li key={item.id}>
                <a href="#" className={styles.shortcutItem}>
                  <FallbackImage
                    src={item.cover}
                    alt={item.name}
                    className={styles.shortcutCover}
                  />
                  <span className={styles.shortcutName}>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </aside>
  );
};

FacebookSidebar.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    fullname: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    avatar: PropTypes.string,
  }),
  menu: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    })
  ),
  // shortcuts: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  //     name: PropTypes.string.isRequired,
  //     cover: PropTypes.string,
  //   })
  // ),
  className: PropTypes.string,
};

export default FacebookSidebar;
