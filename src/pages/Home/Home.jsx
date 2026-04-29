import { useState, useEffect } from "react";
import { PostList } from "../../components";
import FacebookSidebar from "../../components/FacebookSidebar/FacebookSidebar";
import PostModal from "../../components/PostModal/PostModal";
import styles from "./Home.module.scss";
import postService from "../../services/postService";
import useUser from "../../hook/useUser";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const { currentUser } = useUser();
  const me = currentUser?.data;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await postService.getList();
        setPosts(data?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buildModalPost = (post) => {
    if (!post) return null;
    const media = [post.thumbnail, post.thumbnail].filter(Boolean);
    return {
      ...post,
      media,
      page_name: post.page_name || post.title,
      sub_author:
        post.user?.fullname ||
        [post.user?.first_name, post.user?.last_name].filter(Boolean).join(" ") ||
        post.user?.username,
      comments_count: post.comments_count ?? 0,
    };
  };

  return (
    <div className={styles.home}>
      <aside className={styles.leftSidebar}>
        <FacebookSidebar user={me} />
      </aside>

      <div className="container">
        <div className={styles.feedLayout}>
          <main className={styles.feedMain}>
            <PostList
              posts={posts}
              loading={loading}
              showPagination={false}
              layout="list"
              maxPosts={posts?.length || 0}
              className={styles.recentPosts}
            />
          </main>
        </div>
      </div>

      <PostModal
        post={activePost}
        open={!!activePost}
        onClose={() => setActivePost(null)}
      />
    </div>
  );
};

export default Home;
