import { useState, memo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Card from "../Card/Card";
import Badge from "../Badge/Badge";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import getFirstVideo from "../../utils/getFirstVideo";
import useAutoPlayVideo from "../../hook/useAutoPlayVideo";
import styles from "./PostCard.module.scss";

const resolveImage = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const PostCard = ({
  id,
  title,
  thumbnail,
  content,
  user_id,
  published_at,
  readTime,
  topic,
  slug,
  loading = false,
  compact = false,
  variant = "card",
  className,
  // New interaction props
  description,
  likes_count,
  views_count,

  views = 0,
  isLiked = false,
  isBookmarked = false,
  showViewCount = true,
  showInteractions = true,
  onLike,
  onBookmark,
  ...props
}) => {
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticBookmarked, setOptimisticBookmarked] =
    useState(isBookmarked);
  const [optimisticLikes, setOptimisticLikes] = useState(likes_count);
  const [viewCount, setViewCount] = useState(views_count);

  const videoSrc = getFirstVideo(content);
  const autoPlayVideoRef = useAutoPlayVideo();

  const [likingInProgress, setLikingInProgress] = useState(false);
  const [bookmarkingInProgress, setBookmarkingInProgress] = useState(false);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  // console.log(user_id.username);

  const handleLike = async () => {
    if (!onLike || likingInProgress) return;

    setLikingInProgress(true);

    // Optimistic update
    setOptimisticLiked(!optimisticLiked);
    setOptimisticLikes(
      optimisticLiked ? optimisticLikes - 1 : optimisticLikes + 1
    );
    setViewCount(optimisticLiked ? optimisticLikes - 1 : optimisticLikes + 1);
    try {
      await onLike(id, !optimisticLiked);
    } catch (error) {
      // Revert on error
      setOptimisticLiked(optimisticLiked);
      setOptimisticLikes(optimisticLikes);
      console.error("Failed to toggle like:", error);
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleBookmark = async () => {
    if (!onBookmark || bookmarkingInProgress) return;

    setBookmarkingInProgress(true);

    // Optimistic update
    setOptimisticBookmarked(!optimisticBookmarked);

    try {
      await onBookmark(id, !optimisticBookmarked);
    } catch (error) {
      // Revert on error
      setOptimisticBookmarked(optimisticBookmarked);
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setBookmarkingInProgress(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${slug}`;
    const shareData = {
      title: title || "Blog post",
      text: description || "",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (loading) {
    return (
      <Card
        className={`${styles.postCard} ${styles.loading} ${className || ""}`}
        variant="default"
        padding="none"
        {...props}
      >
        <div className={styles.skeletonImage} />
        <div className={styles.content}>
          <div className={styles.skeletonBadge} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonExcerpt} />
          <div className={styles.skeletonMeta} />
        </div>
      </Card>
    );
  }

  if (variant === "feed") {
    const authorName =
      user_id?.fullname ||
      user_id?.full_name ||
      [user_id?.first_name, user_id?.last_name].filter(Boolean).join(" ") ||
      user_id?.username;

    return (
      <Card
        className={`${styles.feedCard} ${className || ""}`}
        variant="default"
        padding="none"
        {...props}
      >
        {/* Header: Avatar + Author + Date */}
        <div className={styles.feedHeader}>
          <Link
            to={user_id?.username ? `/profile/${user_id.username}` : "#"}
            className={styles.feedAuthorLink}
          >
            <FallbackImage
              src={resolveImage(user_id?.avatar)}
              alt={authorName || "Author"}
              className={styles.feedAvatar}
            />
            <div className={styles.feedAuthorMeta}>
              <span className={styles.feedAuthorName}>{authorName}</span>
              <span className={styles.feedDate}>
                {formatDate(published_at)}
                {readTime ? ` • ${readTime} min read` : ""}
              </span>
            </div>
          </Link>
        </div>

        {/* Body: Title + Description + Topics */}
        <div className={styles.feedBody}>
          <Link to={`/blog/${slug}`} className={styles.feedTitleLink}>
            <h3 className={styles.feedTitle}>{title}</h3>
          </Link>
          {description && (
            <p className={styles.feedDescription}>{description}</p>
          )}
          {Array.isArray(topic) && topic.length > 0 && (
            <div className={styles.feedTopics}>
              {topic.map((t) => (
                <Badge key={t.id} variant="primary" size="sm">
                  {t.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Media: video plays inline in the feed, otherwise the thumbnail */}
        {videoSrc ? (
          <div className={styles.feedVideoWrapper}>
            <video
              ref={autoPlayVideoRef}
              src={videoSrc}
              poster={thumbnail ? resolveImage(thumbnail) : undefined}
              className={styles.feedVideo}
              controls
              muted
              playsInline
              preload="metadata"
            />
          </div>
        ) : thumbnail && (
          <Link to={`/blog/${slug}`} className={styles.feedImageLink}>
            <FallbackImage
              src={resolveImage(thumbnail)}
              alt={title}
              className={styles.feedImage}
              lazy={true}
            />
          </Link>
        )}

        {/* Stats row */}
        {showInteractions &&
          (optimisticLikes > 0 || views_count > 0) && (
            <div className={styles.feedStats}>
              {optimisticLikes > 0 && (
                <span className={styles.feedStat}>
                  ❤ {optimisticLikes}
                </span>
              )}
              {showViewCount && views_count > 0 && (
                <span className={styles.feedStat}>
                  👁 {views_count} views
                </span>
              )}
            </div>
          )}

        {/* Action bar: Like / Comment / Save */}
        {showInteractions && (
          <div className={styles.feedActions}>
            <button
              className={`${styles.feedActionButton} ${
                optimisticLiked ? styles.feedActionLiked : ""
              }`}
              onClick={handleLike}
              disabled={likingInProgress}
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={optimisticLiked ? "currentColor" : "none"}
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Like</span>
            </button>

            <Link to={`/blog/${slug}`} className={styles.feedActionButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Comment</span>
            </Link>

            <button
              className={styles.feedActionButton}
              onClick={handleShare}
              type="button"
              aria-label="Share this post"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="18"
                  cy="5"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="6"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="19"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Share</span>
            </button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card
      className={`${styles.postCard} ${compact ? styles.compact : ""} ${
        className || ""
      }`}
      variant="default"
      hoverable
      padding="none"
      {...props}
    >
      {/* Featured Image */}
      <div className={styles.imageContainer}>
        <Link to={`/blog/${slug}`}>
          {!thumbnail && videoSrc ? (
            // First frame of the video stands in for a missing thumbnail
            <video
              src={`${videoSrc}#t=0.1`}
              className={styles.image}
              muted
              playsInline
              preload="metadata"
              aria-label={title}
            />
          ) : (
            <FallbackImage
              src={resolveImage(thumbnail)}
              alt={title}
              className={styles.image}
              lazy={true}
            />
          )}
        </Link>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Topic Badge */}
        {/* Đã sửa: Kiểm tra topic là mảng trước khi map */}
        {Array.isArray(topic) && topic.length > 0 && (
          <div className={styles.topicBadges}>
            {topic.map((t) => (
              <Badge key={t.id} variant="primary" size="sm">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className={styles.title}>
          <Link to={`/blog/${slug}`} className={styles.titleLink}>
            {title}
          </Link>
        </h3>
        <p className={styles.description}>
          <Link to={`/blog/${slug}`} className={styles.titleLink}>
            {description}
          </Link>
        </p>

        {/* Meta Information */}
        <div className={styles.meta}>
          <div className={styles.user_id}>
            {user_id?.avatar && (
              <FallbackImage
                src={resolveImage(user_id.avatar)}
                alt={user_id.full_name}
                className={styles.authorAvatar}
                lazy={true}
              />
            )}
            <Link
              to={user_id?.username ? `/profile/${user_id.username}` : "#"}
              className={styles.authorName}
            >
              {user_id?.username}
            </Link>
          </div>

          <div className={styles.metaInfo}>
            <span className={styles.date}>{formatDate(published_at)}</span>
            {readTime && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.readTime}>{readTime} min read</span>
              </>
            )}
          </div>
        </div>

        {/* Interactions */}
        {showInteractions && (
          <div className={styles.interactions}>
            <div className={styles.stats}>
              {/* View Count */}
              {showViewCount && views > 0 && (
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {views}
                </span>
              )}

              {/* Like Count */}
              {optimisticLikes > 0 && (
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M14 6.5c0 4.8-5.25 7.5-6 7.5s-6-2.7-6-7.5C2 3.8 4.8 1 8 1s6 2.8 6 5.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {optimisticLikes}
                </span>
              )}
              {/* view count */}
              {viewCount > 0 && (
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M14 6.5c0 4.8-5.25 7.5-6 7.5s-6-2.7-6-7.5C2 3.8 4.8 1 8 1s6 2.8 6 5.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {viewCount}
                </span>
              )}
            </div>

            <div className={styles.actions}>
              {/* Like Button */}
              <button
                className={`${styles.actionButton} ${
                  optimisticLiked ? styles.liked : ""
                } ${likingInProgress ? styles.loading : ""}`}
                onClick={handleLike}
                disabled={likingInProgress}
                title={optimisticLiked ? "Unlike" : "Like"}
                aria-label={`${optimisticLiked ? "Unlike" : "Like"} this post`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={optimisticLiked ? "currentColor" : "none"}
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Bookmark Button */}
              <button
                className={`${styles.actionButton} ${
                  optimisticBookmarked ? styles.bookmarked : ""
                } ${bookmarkingInProgress ? styles.loading : ""}`}
                onClick={handleBookmark}
                disabled={bookmarkingInProgress}
                title={optimisticBookmarked ? "Remove bookmark" : "Bookmark"}
                aria-label={`${
                  optimisticBookmarked ? "Remove bookmark from" : "Bookmark"
                } this post`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill={optimisticBookmarked ? "currentColor" : "none"}
                >
                  <path
                    d="M3 1C2.45 1 2 1.45 2 2V15L8 12L14 15V2C14 1.45 13.55 1 13 1H3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

PostCard.propTypes = {
  title: PropTypes.string.isRequired,
  thumbnail: PropTypes.string,
  content: PropTypes.string,
  user_id: PropTypes.shape({
    full_name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  published_at: PropTypes.string.isRequired,
  readTime: PropTypes.number,
  // Đã sửa: topic là một mảng
  topic: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
    })
  ),
  slug: PropTypes.string,
  featuredImage: PropTypes.string,
  loading: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
  // New interaction props
  description: PropTypes.string,
  likes_count: PropTypes.number,
  views_count: PropTypes.number,
  views: PropTypes.number,
  isLiked: PropTypes.bool,
  isBookmarked: PropTypes.bool,
  showViewCount: PropTypes.bool,
  showInteractions: PropTypes.bool,
  onLike: PropTypes.func,
  onBookmark: PropTypes.func,
};

export default memo(PostCard);
