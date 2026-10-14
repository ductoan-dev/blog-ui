import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Badge from "../Badge/Badge";
import FallbackImage from "../FallbackImage/FallbackImage";
import resolveMediaUrl from "../../utils/resolveMediaUrl";
import styles from "./BlogContent.module.scss";

// Quill editor saves &nbsp; between words in headings/justified paragraphs.
// These non-breaking spaces prevent normal word-wrap and cause mid-word breaks.
const normalizeHtml = (html) =>
  html ? html.replace(/&nbsp;/g, " ").replace(/ /g, " ") : "";

const BlogContent = ({
  title,
  content,
  description,
  thumbnail,
  user,
  avatar,
  public_at,
  updatedAt,
  readTime,
  topic,
  tags = [],
  featuredImage,
  loading = false,
  className,
  ...props
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const authorData = user;
  const authorAvatar = authorData?.avatar || avatar;
  const authorName =
    authorData?.full_name ||
    (authorData?.first_name && authorData?.last_name
      ? `${authorData.first_name} ${authorData.last_name}`
      : authorData?.name || "Unknown Author");

  const authorUsername =
    authorData?.username || authorName?.toLowerCase().replace(/\s+/g, "-");

  const displayImage = featuredImage || thumbnail;

  if (loading) {
    return (
      <article
        className={`${styles.blogContent} ${className || ""}`}
        {...props}
      >
        <div className={styles.skeleton}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonMeta} />
          </div>
          <div className={styles.skeletonContent}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={styles.skeletonParagraph} />
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`${styles.blogContent} ${className || ""}`} {...props}>
      {displayImage && (
        <div className={styles.imageContainer}>
          <FallbackImage
            src={resolveMediaUrl(displayImage)}
            alt={title}
            className={styles.featuredImage}
          />
        </div>
      )}

      <header className={styles.header}>
        {topic && (
          <div className={styles.topicBadge}>
            <Badge variant="primary" size="md">
              {typeof topic === "object" ? topic.name : topic}
            </Badge>
          </div>
        )}

        <h1 className={styles.title}>{title}</h1>

        <div className={styles.meta}>
          <div className={styles.authorSection}>
            {authorAvatar && (
              <FallbackImage
                src={resolveMediaUrl(authorAvatar)}
                alt={authorName}
                className={styles.authorAvatar}
              />
            )}
            <div className={styles.authorInfo}>
              <Link
                to={`/profile/${authorUsername}`}
                className={styles.authorName}
              >
                {authorName}
              </Link>
              <div className={styles.dateInfo}>
                <time dateTime={public_at} className={styles.publishDate}>
                  {formatDate(public_at)}
                </time>
                {updatedAt && updatedAt !== public_at && (
                  <span className={styles.updateInfo}>
                    • Updated {formatDate(updatedAt)}
                  </span>
                )}
                {readTime && (
                  <span className={styles.readTime}>• {readTime} min read</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Description */}
      {description && (
        <div className={styles.description}>
          {typeof description === "string" ? (
            <div
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: normalizeHtml(description) }}
            />
          ) : (
            description
          )}
        </div>
      )}

      {/* Main Content */}
      {content && (
        <div className={styles.content}>
          {typeof content === "string" ? (
            <div
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: normalizeHtml(content) }}
            />
          ) : (
            content
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <footer className={styles.footer}>
          <div className={styles.tags}>
            <span className={styles.tagsLabel}>Tags:</span>
            <div className={styles.tagsList}>
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {typeof tag === "object" ? tag.name : tag}
                </Badge>
              ))}
            </div>
          </div>
        </footer>
      )}
    </article>
  );
};

BlogContent.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
    .isRequired,
  thumbnail: PropTypes.string,
  user: PropTypes.shape({
    full_name: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
    username: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
  }),
  avatar: PropTypes.string,
  public_at: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  readTime: PropTypes.number,
  topic: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ name: PropTypes.string }),
  ]),
  tags: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string }),
    ])
  ),
  featuredImage: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default BlogContent;
