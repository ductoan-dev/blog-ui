import PropTypes from "prop-types";
import PostCard from "../PostCard/PostCard";
import EmptyState from "../EmptyState/EmptyState";
import Loading from "../Loading/Loading";
import styles from "./FeaturedPosts.module.scss";
import postService from "../../services/postService";

const FeaturedPosts = ({
  posts = [],
  loading = false,
  title = "Featured Posts",
  showTitle = true,
  maxPosts = 3,
  className,
  ...props
}) => {
  if (loading) {
    return (
      <section
        className={`${styles.featuredPosts} ${className || ""}`}
        {...props}
      >
        {showTitle && <h2 className={styles.title}>{title}</h2>}
        <Loading size="md" text="Loading featured posts..." />
      </section>
    );
  }

  console.log(posts);

  if (!posts.length) {
    return (
      <section
        className={`${styles.featuredPosts} ${className || ""}`}
        {...props}
      >
        {showTitle && <h2 className={styles.title}>{title}</h2>}
        <EmptyState
          title="No featured posts"
          description="There are no featured posts available at the moment."
          icon="⭐"
        />
      </section>
    );
  }
  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = new Date(a.published_at || a.createdAt || 0).getTime();
    const bTime = new Date(b.published_at || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
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
      const check =
        Object.keys(error).length === 0 && error.constructor === Object;
      throw new Error(
        !check ? error : "You must be logged in to save this post."
      );
    }
  };

  const displayPosts = sortedPosts.slice(0, maxPosts);

  return (
    <section
      className={`${styles.featuredPosts} ${className || ""}`}
      {...props}
    >
      {showTitle && <h2 className={styles.title}>{title}</h2>}

      <div className={styles.postsGrid}>
        {displayPosts.map((post, index) => (
          <div
            key={post.id || post.slug}
            className={`${styles.postItem} ${
              index === 0 ? styles.featured : ""
            }`}
          >
            <PostCard
              title={post.title}
              thumbnail={post.thumbnail}
              user_id={post.user}
              description={post.description}
              likes_count={post.likes_count}
              views_count={post.views_count}
              published_at={post.published_at}
              readTime={post.readTime}
              like={post.like_count}
              topic={post.topic?.first_name}
              isLiked={post?.is_like || false}
              onLike={(id, liked) => handleLike(id, liked)}
              onBookmark={(id, liked) => handleBookmark(id, liked)}
              isBookmarked={post?.is_bookmark || false}
              slug={post.slug}
              featuredImage={post.featuredImage}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

FeaturedPosts.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      thumbnail: PropTypes.string,
      user_id: PropTypes.shape({
        first_name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
      }).isRequired,
      // like_count: PropTypes.number,
      description: PropTypes.string.isRequired,
      published_at: PropTypes.string.isRequired,
      readTime: PropTypes.number,
      topic: PropTypes.string,
      slug: PropTypes.string.isRequired,
      featuredImage: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  maxPosts: PropTypes.number,
  className: PropTypes.string,
};

export default FeaturedPosts;
