import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import FacebookSidebar from "../../components/FacebookSidebar/FacebookSidebar";
import FallbackImage from "../../components/FallbackImage/FallbackImage";
import Loading from "../../components/Loading/Loading";
import styles from "./FollowingFeed.module.scss";
import userService from "../../services/userService";
import useUser from "../../hook/useUser";
import isHttps from "../../utils/isHttps";

const resolveAvatar = (src) =>
  src
    ? isHttps(src)
      ? src
      : `${import.meta.env.VITE_BASE_URL}/${src}`
    : null;

const FollowingFeed = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();
  const me = currentUser?.data;

  useEffect(() => {
    if (!me?.id) {
      setLoading(false);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const result = await userService.getFollowingList(me.id);
        if (!ignore) setUsers(result?.data || []);
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [me?.id]);

  return (
    <div className={styles.page}>
      <aside className={styles.leftSidebar}>
        <FacebookSidebar user={me} />
      </aside>

      <div className="container">
        <div className={styles.layout}>
          <main className={styles.main}>
            <div className={styles.header}>
              <h2 className={styles.title}>Đang theo dõi</h2>
              <p className={styles.subtitle}>
                {loading ? "" : `${users.length} người`}
              </p>
            </div>

            {!me ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>👥</span>
                <p>Đăng nhập để xem danh sách bạn đang theo dõi</p>
                <Link to="/login" className={styles.loginBtn}>Đăng nhập</Link>
              </div>
            ) : loading ? (
              <Loading size="md" />
            ) : users.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>👤</span>
                <p>Bạn chưa theo dõi ai. Khám phá và theo dõi các tác giả bạn yêu thích!</p>
                <Link to="/" className={styles.loginBtn}>Khám phá</Link>
              </div>
            ) : (
              <div className={styles.userGrid}>
                {users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    className={styles.userCard}
                  >
                    <FallbackImage
                      src={resolveAvatar(u.avatar)}
                      alt={u.username}
                      className={styles.avatar}
                    />
                    <div className={styles.info}>
                      <span className={styles.name}>
                        {u.fullname ||
                          [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          u.username}
                      </span>
                      <span className={styles.username}>@{u.username}</span>
                      {u.title && (
                        <span className={styles.title2}>{u.title}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FollowingFeed;
