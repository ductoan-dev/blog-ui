import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PostList } from "../../components";
import FacebookSidebar from "../../components/FacebookSidebar/FacebookSidebar";
import FallbackImage from "../../components/FallbackImage/FallbackImage";
import Loading from "../../components/Loading/Loading";
import styles from "./Search.module.scss";
import postService from "../../services/postService";
import userService from "../../services/userService";
import useUser from "../../hook/useUser";
import isHttps from "../../utils/isHttps";

const resolveAvatar = (src) =>
  src
    ? isHttps(src)
      ? src
      : `${import.meta.env.VITE_BASE_URL}/${src}`
    : null;

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useUser();
  const me = currentUser?.data;

  useEffect(() => {
    if (!q.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const [postResult, userResult] = await Promise.all([
          postService.search(q),
          userService.searchUsers(q),
        ]);
        if (!ignore) {
          setPosts(postResult?.data || []);
          setUsers(userResult?.data || []);
        }
      } catch {
        if (!ignore) {
          setPosts([]);
          setUsers([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q]);

  const hasResults = posts.length > 0 || users.length > 0;

  return (
    <div className={styles.page}>
      <aside className={styles.leftSidebar}>
        <FacebookSidebar user={me} />
      </aside>

      <div className="container">
        <div className={styles.layout}>
          <main className={styles.main}>
            <div className={styles.header}>
              <h2 className={styles.title}>Kết quả tìm kiếm</h2>
              {q && !loading && (
                <p className={styles.meta}>
                  {hasResults
                    ? `${posts.length} bài viết · ${users.length} người dùng cho "${q}"`
                    : `Không tìm thấy kết quả cho "${q}"`}
                </p>
              )}
            </div>

            {!q ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔍</span>
                <p>Nhập từ khóa vào thanh tìm kiếm để bắt đầu</p>
              </div>
            ) : loading ? (
              <Loading size="md" />
            ) : (
              <>
                {users.length > 0 && (
                  <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Người dùng</h3>
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
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>
                              {u.fullname ||
                                [u.first_name, u.last_name]
                                  .filter(Boolean)
                                  .join(" ") ||
                                u.username}
                            </span>
                            <span className={styles.userHandle}>
                              @{u.username}
                            </span>
                            {u.title && (
                              <span className={styles.userTitle}>{u.title}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {posts.length > 0 && (
                  <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Bài viết</h3>
                    <PostList
                      posts={posts}
                      loading={false}
                      showPagination={false}
                      layout="list"
                      maxPosts={posts.length}
                    />
                  </section>
                )}

                {!hasResults && (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>😕</span>
                    <p>Không tìm thấy kết quả nào phù hợp</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Search;
