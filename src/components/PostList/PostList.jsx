import PropTypes from "prop-types";
import PostCard from "../PostCard/PostCard";
import Pagination from "../Pagination/Pagination";
import EmptyState from "../EmptyState/EmptyState";
import Loading from "../Loading/Loading";
import styles from "./PostList.module.scss";
import postService from "../../services/postService";

const PostList = ({
  posts = [],
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxPosts = 3,
  showPagination = true,
  layout = "grid",
  className,
  ...props
}) => {
  if (loading) {
    return (
      <div className={`${styles.postList} ${className || ""}`} {...props}>
        <Loading size="md" text="Loading posts..." />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className={`${styles.postList} ${className || ""}`} {...props}>
        <EmptyState
          title="No posts found"
          description="There are no posts available for this topic."
          icon="📝"
        />
      </div>
    );
  }

  const handleLike = async (postId) => {
    try {
      return await postService.toggleLikePost(postId);
    } catch (error) {
      throw new Error(error);
    }
  };

  const handleBookmark = async (postId) => {
    try {
      return await postService.toggleBookmarkPost(postId);
    } catch (error) {
      throw new Error(error);
    }
  };

  const displayPosts = posts.slice(0, maxPosts);

  return (
    <div className={`${styles.postList} ${className || ""}`} {...props}>
      <div className={`${styles.postsContainer} ${styles[layout]}`}>
        {displayPosts.map((post) => {
          return (
            <div key={post.id || post.slug} className={styles.postItem}>
              <PostCard
                id={post.id}
                variant={layout === "list" ? "feed" : "card"}
                likes_count={post.likes_count}
                views_count={post.views_count}
                title={post.title}
                description={post.description}
                user_id={post.user}
                published_at={post.published_at}
                readTime={Math.floor((Math.random() + 1) * 10)}
                topic={post.topics}
                slug={post.slug}
                thumbnail={post.thumbnail}
                content={post.content}
                isLiked={!!post?.is_like}
                onLike={(id, liked) => handleLike(id, liked)}
                onBookmark={(id, liked) => handleBookmark(id, liked)}
                isBookmarked={!!post?.is_bookmark}
              />
            </div>
          );
        })}
      </div>
      {showPagination && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

PostList.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      meta_description: PropTypes.string,
      user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
      }).isRequired,
      published_at: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      thumbnail: PropTypes.string,
      likes_count: PropTypes.number,
      views_count: PropTypes.number,
      is_like: PropTypes.bool,
      is_bookmark: PropTypes.bool,
      topics: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  loading: PropTypes.bool,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  showPagination: PropTypes.bool,
  layout: PropTypes.oneOf(["grid", "list"]),
  maxPosts: PropTypes.number,
  className: PropTypes.string,
};

export default PostList;
