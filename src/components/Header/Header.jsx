import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Navigation from "../Navigation/Navigation";
import Button from "../Button/Button";
import FallbackImage from "../FallbackImage/FallbackImage";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import styles from "./Header.module.scss";
import useUser from "../../hook/useUser";
import isHttps from "../../utils/isHttps";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  // Mock authentication state - trong thực tế sẽ từ context/store
  const { logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const { currentUser } = useUser();
  const { notifications, markNotifRead, markAllNotifsRead } = useSocket() || {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setIsMobileMenuOpen(false);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
  };

  useEffect(() => {
    if (currentUser) {
      setIsAuthenticated(true);
      setUser(currentUser.data);
    }
  }, [currentUser]);

  const liveNotifications = notifications || [];
  const unreadCount = liveNotifications.filter((n) => !n.read).length;

  // Toggle auth state for demo (remove in production)
  // const toggleAuth = () => {
  //     setIsAuthenticated(!isAuthenticated);
  //     setIsDropdownOpen(false);
  // };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    // Clears the session app-wide; protected pages redirect via ProtectedRoute
    logout();

    setIsAuthenticated(false);
    setUser(null);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false); // Close user dropdown if open
  };

  const handleMarkAsRead = async (notificationId) => {
    if (markNotifRead) markNotifRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (markAllNotifsRead) markAllNotifsRead();
  };

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.content}>
          {/* Brand/Logo */}
          <div className={styles.brand}>
            <Link to="/" className={styles.brandLink}>
              <div className={styles.logo}>
                <div className={styles.logoIcon}>
                  <span className={styles.logoText}>B</span>
                </div>
                <h1 className={styles.brandTitle}>BlogUI</h1>
              </div>
            </Link>
          </div>
          {/* Search */}
          <form
            className={styles.search}
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="7"
                cy="7"
                r="5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 11L14 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm trên BlogUI"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>

          {/* Desktop Navigation */}
          <div className={styles.nav}>
            <Navigation />
          </div>

          {/* Auth Actions */}
          <div className={styles.actions}>
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notificationRef}>
                  <NotificationDropdown
                    notifications={liveNotifications}
                    unreadCount={unreadCount}
                    isOpen={isNotificationOpen}
                    onToggle={handleNotificationToggle}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                </div>

                {/* User Menu */}
                <div className={styles.userMenu} ref={dropdownRef}>
                  <button
                    className={styles.userButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <FallbackImage
                      src={
                        isHttps(user?.avatar)
                          ? user?.avatar
                          : `${import.meta.env.VITE_BASE_URL}/${user?.avatar}`
                      }
                      alt={user?.username}
                      className={styles.userAvatar}
                    />
                    <span className={styles.userName}>
                      {user?.fullname ||
                        `${user?.first_name} ${user?.last_name}`}
                    </span>
                    <svg
                      className={`${styles.chevron} ${
                        isDropdownOpen ? styles.chevronOpen : ""
                      }`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownUserInfo}>
                          <div className={styles.dropdownUserName}>
                            {user?.fullname ||
                              `${user?.first_name} ${user?.last_name}`}
                          </div>
                          <div className={styles.dropdownUserEmail}>
                            {user?.email}
                          </div>
                          <div className={styles.dropdownUserRole}>
                            {user?.role ?? "Author"}
                          </div>
                        </div>
                      </div>
                      <nav className={styles.dropdownNav}>
                        <Link
                          to={user?.username ? `/profile/${user.username}` : "#"}
                          className={styles.dropdownItem}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                              fill="currentColor"
                            />
                          </svg>
                          Profile
                        </Link>
                        <Link to="/my-posts" className={styles.dropdownItem}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M14 2H2C1.45 2 1 2.45 1 3V13C1 13.55 1.45 14 2 14H14C14.55 14 15 13.55 15 13V3C15 2.45 14.55 2 14 2ZM14 13H2V3H14V13ZM3 5H13V6H3V5ZM3 8H13V9H3V8ZM3 11H10V12H3V11Z"
                              fill="currentColor"
                            />
                          </svg>
                          My Posts
                        </Link>
                        <Link to="/write" className={styles.dropdownItem}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M12.146 0.146C12.345 -0.053 12.655 -0.053 12.854 0.146L15.854 3.146C16.053 3.345 16.053 3.655 15.854 3.854L5.854 13.854C5.756 13.952 5.628 14.007 5.494 14.007H2C1.448 14.007 1 13.559 1 13.007V9.513C1 9.379 1.055 9.251 1.153 9.153L11.153 -0.847C11.352 -1.046 11.662 -1.046 11.861 -0.847L12.146 0.146ZM2 12.007H4.586L13 3.593L12.407 3L2 13.407V12.007Z"
                              fill="currentColor"
                            />
                          </svg>
                          Write Post
                        </Link>
                        <Link to="/bookmarks" className={styles.dropdownItem}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M3 1C2.45 1 2 1.45 2 2V15L8 12L14 15V2C14 1.45 13.55 1 13 1H3Z"
                              fill="currentColor"
                            />
                          </svg>
                          Bookmarks
                        </Link>
                        <Link to="/settings" className={styles.dropdownItem}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5ZM14.59 9.78C14.66 9.54 14.66 8.46 14.59 8.22L13.46 7.69C13.4 7.45 13.31 7.22 13.2 7L13.73 5.88C13.85 5.68 13.8 5.41 13.61 5.22L12.78 4.39C12.59 4.2 12.32 4.15 12.12 4.27L11 4.8C10.78 4.69 10.55 4.6 10.31 4.54L9.78 3.41C9.68 3.18 9.46 3 9.22 3H8.78C8.54 3 8.32 3.18 8.22 3.41L7.69 4.54C7.45 4.6 7.22 4.69 7 4.8L5.88 4.27C5.68 4.15 5.41 4.2 5.22 4.39L4.39 5.22C4.2 5.41 4.15 5.68 4.27 5.88L4.8 7C4.69 7.22 4.6 7.45 4.54 7.69L3.41 8.22C3.18 8.32 3 8.54 3 8.78V9.22C3 9.46 3.18 9.68 3.41 9.78L4.54 10.31C4.6 10.55 4.69 10.78 4.8 11L4.27 12.12C4.15 12.32 4.2 12.59 4.39 12.78L5.22 13.61C5.41 13.8 5.68 13.85 5.88 13.73L7 13.2C7.22 13.31 7.45 13.4 7.69 13.46L8.22 14.59C8.32 14.82 8.54 15 8.78 15H9.22C9.46 15 9.68 14.82 9.78 14.59L10.31 13.46C10.55 13.4 10.78 13.31 11 13.2L12.12 13.73C12.32 13.85 12.59 13.8 12.78 13.61L13.61 12.78C13.8 12.59 13.85 12.32 13.73 12.12L13.2 11C13.31 10.78 13.4 10.55 13.46 10.31L14.59 9.78Z"
                              fill="currentColor"
                            />
                          </svg>
                          Settings
                        </Link>
                      </nav>
                      <button
                        className={`${styles.dropdownItem} ${styles.logout}`}
                        onClick={handleLogout}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M7 14H2C1.45 14 1 13.55 1 13V3C1 2.45 1.45 2 2 2H7V0H2C0.34 0 0 1.34 0 3V13C0 14.66 1.34 16 2 16H7V14ZM11.09 7L9.09 5C8.7 4.61 8.7 3.98 9.09 3.59C9.48 3.2 10.11 3.2 10.5 3.59L14.5 7.59C14.89 7.98 14.89 8.61 14.5 9L10.5 13C10.11 13.39 9.48 13.39 9.09 13C8.7 12.61 8.7 11.98 9.09 11.59L11.09 9.59H4V6.41H11.09V7Z"
                            fill="currentColor"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.authActions}>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Demo Toggle Button (remove in production) */}
            {/* <button
                            onClick={toggleAuth}
                            className={styles.demoToggle}
                            title="Toggle auth state (demo)"
                        >
                            🔄
                        </button> */}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <span className={isMobileMenuOpen ? styles.active : ""}></span>
            <span className={isMobileMenuOpen ? styles.active : ""}></span>
            <span className={isMobileMenuOpen ? styles.active : ""}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Navigation />
            {!isAuthenticated ? (
              <div className={styles.mobileAuth}>
                <Button variant="ghost" size="md" fullWidth asChild>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button variant="primary" size="md" fullWidth asChild>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </Button>
              </div>
            ) : (
              <div className={styles.mobileUserMenu}>
                <div className={styles.mobileUserInfo}>
                  <FallbackImage
                    src={
                      isHttps(user?.avatar)
                        ? user?.avatar
                        : `${import.meta.env.VITE_BASE_URL}/${user?.avatar}`
                    }
                    alt={user?.name}
                    className={styles.mobileUserAvatar}
                  />
                  <div>
                    <div className={styles.mobileUserName}>{user?.name}</div>
                    <div className={styles.mobileUserEmail}>{user?.email}</div>
                  </div>
                </div>
                <nav className={styles.mobileUserNav}>
                  <Link
                    to={`/profile/${user?.username || "john-doe"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/my-posts"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Posts
                  </Link>
                  <Link to="/write" onClick={() => setIsMobileMenuOpen(false)}>
                    Write Post
                  </Link>
                  <Link
                    to="/bookmarks"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Bookmarks
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button onClick={handleLogout}>Logout</button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
