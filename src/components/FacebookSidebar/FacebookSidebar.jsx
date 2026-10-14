import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import styles from "./FacebookSidebar.module.scss";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

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
  ai: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="metaai-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0064E0"/>
          <stop offset="50%" stopColor="#A033FF"/>
          <stop offset="100%" stopColor="#FF3EC8"/>
        </linearGradient>
      </defs>
      {/* Hình ngôi sao 4 cánh dạng thoi — logo Meta AI */}
      <path
        d="M14 2 C14 2 15.8 9.5 20 13 C22.5 15 26 14 26 14 C26 14 22.5 13 20 15 C15.8 18.5 14 26 14 26 C14 26 12.2 18.5 8 15 C5.5 13 2 14 2 14 C2 14 5.5 15 8 13 C12.2 9.5 14 2 14 2Z"
        fill="url(#metaai-grad)"
      />
    </svg>
  ),
  messenger: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="messenger-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C6FF" />
          <stop offset="100%" stopColor="#0055FF" />
        </linearGradient>
      </defs>
      {/* Speech bubble */}
      <path
        d="M12 2C6.48 2 2 6.26 2 11.5c0 2.91 1.35 5.51 3.5 7.26V22l3.34-1.84c.99.28 2.04.44 3.16.44 5.52 0 10-4.26 10-9.5S17.52 2 12 2z"
        fill="url(#messenger-grad)"
      />
      {/* Lightning bolt */}
      <path
        d="M13.5 7.5L9.5 13H12L10 17L14 11.5H11.5L13.5 7.5Z"
        fill="white"
      />
    </svg>
  ),
  // groups: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <circle cx="12" cy="12" r="10" fill="#2563eb" opacity="0.15" />
  //     <circle cx="9" cy="11" r="3" fill="#2563eb" />
  //     <circle cx="15" cy="11" r="3" fill="#60a5fa" />
  //     <path d="M4 19c1-3 4-4 7-4s6 1 7 4" stroke="#2563eb" strokeWidth="1.5" fill="none" />
  //   </svg>
  // ),
  // memories: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="2" fill="#dbeafe" />
  //     <path d="M12 7v5l3 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
  //   </svg>
  // ),
  saved: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4V3z" fill="#a855f7" />
    </svg>
  ),
  // reels: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <rect x="3" y="5" width="18" height="14" rx="3" fill="#ef4444" />
  //     <path d="M10 9l5 3-5 3V9z" fill="#fff" />
  //   </svg>
  // ),
  // marketplace: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <path d="M3 8l2-4h14l2 4v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0V8z" fill="#0ea5e9" />
  //     <path d="M5 11v9h14v-9" stroke="#0369a1" strokeWidth="1.5" fill="none" />
  //   </svg>
  // ),
  // feed: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <rect x="3" y="4" width="18" height="16" rx="2" fill="#2563eb" opacity="0.15" />
  //     <rect x="6" y="7" width="12" height="2" fill="#2563eb" />
  //     <rect x="6" y="11" width="12" height="2" fill="#2563eb" />
  //     <rect x="6" y="15" width="8" height="2" fill="#2563eb" />
  //   </svg>
  // ),
  // more: (
  //   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //     <circle cx="12" cy="12" r="10" fill="#e5e7eb" />
  //     <path d="M8 11l4 4 4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  //   </svg>
  // ),
};

const DEFAULT_MENU = [
  { key: "friends", label: "Theo dõi", to: "/following" },
  { key: "ai", label: "Meta AI", to: "https://www.meta.ai", external: true },
  { key: "messenger", label: "Messenger", to: "/messages" },
  // { key: "groups", label: "Nhóm", to: "#" },
  // { key: "memories", label: "Kỷ niệm", to: "#" },
  { key: "saved", label: "Đã lưu", to: "/bookmarks" },
  // { key: "reels", label: "Thước phim", to: "#" },
  // { key: "marketplace", label: "Marketplace", to: "#" },
  // { key: "feed", label: "Bảng feed", to: "/" },
  // { key: "more", label: "Xem thêm", to: "#" },
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
  const { totalUnread } = useSocket() || {};
  const { isAuthenticated } = useAuth();

  // Every item links to a signed-in page, so guests see nothing
  if (!isAuthenticated) return null;

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

        {menu.map((item) =>
          item.external ? (
            <a
              key={item.key}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
            >
              <span className={styles.icon}>{ICONS[item.key]}</span>
              <span className={styles.label}>{item.label}</span>
            </a>
          ) : (
            <Link key={item.key} to={item.to} className={styles.menuItem}>
              <span className={styles.icon}>
                {ICONS[item.key]}
                {item.key === "messenger" && totalUnread > 0 && (
                  <span className={styles.badge}>
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          )
        )}
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
      external: PropTypes.bool,
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
