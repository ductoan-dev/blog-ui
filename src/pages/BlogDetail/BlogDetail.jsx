import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  BlogContent,
  AuthorInfo,
  // RelatedPosts,
  CommentSection,
  Loading,
} from "../../components";
import styles from "./BlogDetail.module.scss";
import postService from "../../services/postService";
import commentService from "../../services/commentService";
import useUser from "../../hook/useUser";
import userService from "../../services/userService";

const BlogDetail = () => {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  // const [relatedPosts, setRelatedPosts] = useState([]);
  // const [relatedLoading, setRelatedLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Like and bookmark states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [bookmarkingInProgress, setBookmarkingInProgress] = useState(false);
  const [follow, setFollow] = useState(false);
  const { currentUser } = useUser();

  useEffect(() => {
    (async () => {
      if (post) {
        await postService.updateViews(post?.id);
      }
      console.log(post, "hihi");
    })();
  }, [post]); 
  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const response = await postService.getBySlug(slug);
        console.log("Post data:", response);

        if (response?.post) {
          setPost(response.post);
          setLikes(response.post.likes_count || 0);
          setViews(response.post.views_count || 0);
          setIsLiked(response.post.is_like || 0);
        }
      } catch (error) {
        console.error("Failed to load post:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  useEffect(() => {
    if (currentUser?.data) {
      return setIsAuthenticated(true);
    }
    setIsAuthenticated(false);
  }, [currentUser?.data]);

  useEffect(() => {
    if (!post?.id) return;

    try {
      (async () => {
        const result = await commentService.getAllByPostId(post?.id);
        setComments(result.reverse());
      })();
    } catch (error) {
      console.log(error);
    }
  }, [post?.id]);

  // checkFollower
  useEffect(() => {
    if (!post?.user?.id) return;

    (async () => {
      try {
        const result = await userService.checkFollower(post?.user.id);
        setFollow(result.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [post?.user?.id]);

  // useEffect(() => {
  //   if (!post?.id) return;

  //   (async () => {
  //     try {
  //       setRelatedLoading(true);
  //       const postRelates = await postService.getRelatedPosts(post?.id);
  //       setRelatedPosts(postRelates);
  //     } catch (error) {
  //       console.error("Failed to load related posts:", error);
  //     } finally {
  //       setRelatedLoading(false);
  //     }
  //   })();
  // }, [post?.id]);

  const handleAddComment = async (content) => {
    const data = {
      post_id: post.id,
      content,
    };

    try {
      const response = await commentService.create(data);
      const result = response?.data || response;

      if (!result) {
        throw new Error("No data returned from commentService.create");
      }

      const newComment = {
        ...result,
        created_at: result.createdAt || result.created_at,
        updated_at: result.updatedAt || result.updated_at,
        replies: [], // Đảm bảo có mảng replies
      };

      setComments((prev) => [newComment, ...prev]);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // FIX: Sửa logic reply comment
  const handleReplyComment = async (parentId, content) => {
    try {
      // Tìm top-level parent ID
      let topLevelParentId = parentId;

      // Kiểm tra xem parentId có phải là reply không
      for (const comment of comments) {
        if (
          comment.replies &&
          comment.replies.some((reply) => reply.id === parentId)
        ) {
          topLevelParentId = comment.id;
          break;
        }
      }

      const response = await commentService.create({
        post_id: post.id,
        content,
        parent_id: topLevelParentId,
      });

      const result = response?.data || response;

      if (!result) {
        throw new Error("No data returned from commentService.create");
      }

      const newReply = {
        ...result,
        created_at: result.createdAt || result.created_at,
        updated_at: result.updatedAt || result.updated_at,
      };

      // Cập nhật state ngay lập tức
      setComments((prev) =>
        prev.map((comment) =>
          comment?.id === topLevelParentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            : comment
        )
      );

      console.log("Reply added successfully:", newReply);
    } catch (error) {
      console.error("Failed to reply to comment:", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      // Optimistic update trước
      setComments((prev) =>
        prev.map((comment) => {
          if (comment?.id === commentId) {
            return {
              ...comment,
              is_like: !comment.is_like,
              like_count: comment.is_like
                ? comment.likes_count - 1
                : comment.likes_count + 1,
            };
          }

          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.map((reply) => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  is_like: !reply.is_like,
                  like_count: reply.is_like
                    ? reply.likes_count - 1
                    : reply.likes_count + 1,
                };
              }
              return reply;
            });

            return { ...comment, replies: updatedReplies };
          }

          return comment;
        })
      );

      // Gọi API
      await commentService.toggleLike(commentId);
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  // FIX: Sửa logic edit comment
  const handleEditComment = async (commentId, newContent) => {
    try {
      // Gọi API trước
      await commentService.update(commentId, {
        content: newContent,
        edited_at: Date.now(),
      });

      // Cập nhật state sau khi API thành công
      const updateCommentRecursively = (comments) => {
        return comments.map((comment) => {
          if (comment?.id === commentId) {
            return {
              ...comment,
              content: newContent,
              isEdited: true,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentRecursively(comment.replies),
            };
          }
          return comment;
        });
      };

      setComments((prev) => updateCommentRecursively(prev));
      console.log("Comment edited successfully:", commentId);
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  };
  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.update(commentId, {
        deleted_at: Date.now(),
      });

      // Xoá comment khỏi UI
      const deleteCommentRecursively = (comments) => {
        return comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: deleteCommentRecursively(comment.replies),
              };
            }
            return comment;
          });
      };

      setComments((prev) => deleteCommentRecursively(prev));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleLikePost = async () => {
    if (likingInProgress) return;

    setLikingInProgress(true);

    // Optimistic update
    const previousIsLiked = isLiked;
    const previousLikes = likes;

    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    try {
      await postService.toggleLikePost(post?.id);
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      console.error("Failed to toggle like:", error);
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleBookmarkPost = async () => {
    if (bookmarkingInProgress) return;

    setBookmarkingInProgress(true);

    // Optimistic update
    const previousIsBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      await postService.toggleBookmarkPost(post?.id);
    } catch (error) {
      // Revert on error
      setIsBookmarked(previousIsBookmarked);
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setBookmarkingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading size="md" text="Loading article..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.notFoundContainer}>
        <h1>Article not found</h1>
        <p>
          The article you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Article Header with Interactions */}
      <div className={styles.articleHeader}>
        <BlogContent {...post} />

        {/* Post Interactions */}
        <div className={styles.interactions}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="8" r="2" />
              </svg>
              <span>{views} views</span>
            </div>

            <div className={styles.stat}>
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 6.5c0 4.8-5.25 7.5-6 7.5s-6-2.7-6-7.5C2 3.8 4.8 1 8 1s6 2.8 6 5.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{likes} likes</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${
                isLiked ? styles.liked : ""
              } ${likingInProgress ? styles.loading : ""}`}
              onClick={handleLikePost}
              disabled={likingInProgress}
              title={isLiked ? "Unlike" : "Like"}
            >
              <svg viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"}>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isLiked ? "Liked" : "Like"}
            </button>

            <button
              className={`${styles.actionButton} ${
                isBookmarked ? styles.bookmarked : ""
              } ${bookmarkingInProgress ? styles.loading : ""}`}
              onClick={handleBookmarkPost}
              disabled={bookmarkingInProgress}
              title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <svg
                viewBox="0 0 16 16"
                fill={isBookmarked ? "currentColor" : "none"}
              >
                <path
                  d="M3 1C2.45 1 2 1.45 2 2V15L8 12L14 15V2C14 1.45 13.55 1 13 1H3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className={styles.authorSection}>
        <AuthorInfo
          follow={follow}
          user={{
            ...post.user,
            social: {
              twitter: post.user?.twitter_url,
              github: post.user?.github_url,
              linkedin: post.user?.linkedin_url,
              website: post.user?.website_url,
            },
          }}
        />
      </div>

      {/* Related Posts */}
      {/* <div className={styles.contentSection}>
        <RelatedPosts
          posts={relatedPosts}
          loading={relatedLoading}
          title="Related Articles"
        />
      </div> */}

      {/* Comments */}
      <div className={styles.contentSection}>
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
          onReplyComment={handleReplyComment}
          onLikeComment={handleLikeComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

export default BlogDetail;
