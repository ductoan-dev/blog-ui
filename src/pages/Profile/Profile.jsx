import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthorInfo from "../../components/AuthorInfo/AuthorInfo";
import PostList from "../../components/PostList/PostList";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import Loading from "../../components/Loading/Loading";
import FallbackImage from "../../components/FallbackImage/FallbackImage";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import FollowListModal from "../../components/FollowListModal/FollowListModal";

import styles from "./Profile.module.scss";
import userService from "../../services/userService";
import postService from "../../services/postService";

import useUser from "../../hook/useUser";
import isHttps from "../../utils/isHttps";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [user, setUser] = useState({});
  const [isFollow, setIsFollow] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followModal, setFollowModal] = useState(null); // "followers" | "following" | null
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const { currentUser } = useUser();
  // console.log(currentUser);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getUserByUserName(username);

        if (!response?.succsess || !response?.data) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const userData = { ...response.data };

        if (typeof userData.skills === "string") {
          try {
            const parsed = JSON.parse(userData.skills);
            userData.skills = Array.isArray(parsed) ? parsed : [];
          } catch {
            userData.skills = [];
          }
        } else if (!Array.isArray(userData.skills)) {
          userData.skills = [];
        }

        setUser({
          ...userData,
          social: {
            twitter: userData.twitter_url,
            github: userData.github_url,
            linkedin: userData.linkedin_url,
            website: userData.website_url,
          },
        });
        setFollowers(userData.follower_count || 0);

        setProfile({
          ...userData,
          name:
            `${userData?.first_name || ""} ${
              userData?.last_name || ""
            }`.trim() || userData?.username,
          avatar:
            userData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              userData.username
            )}&background=6366f1&color=fff`,
          title: userData.title || "",
          bio: userData.about || "",
          location: userData.address || "",
          website: userData.website_url || "",
          joinedDate: userData.created_at || new Date().toISOString(),
          featuredImage:
            userData?.cover_image ||
            "https://via.placeholder.com/1200x300?text=Cover+Image",
          badges: userData.badges || [],
          stats: {
            posts_count: userData.posts_count || 0,
            followers: userData.follower_count || 0,
            following: userData.following_count || 0,
            likes: userData.likes_count || 0,
          },
        });
        console.log("Profile đã được tải thành công:", userData);
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  //
  const isOwnProfile = currentUser?.data?.id === user?.id;

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user?.id && currentUser?.data?.id !== user?.id) {
        try {
          const check = await userService.checkFollower(user.id);
          setIsFollow(check?.data);
        } catch (error) {
          console.log(error);
        }
      } else if (!user?.id) {
        console.log("User ID chưa có sẵn để kiểm tra trạng thái theo dõi.");
      }
    };
    checkFollowStatus();
  }, [user, currentUser]);

  useEffect(() => {
    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const postsResponse = await postService.getByUserName(username);
        setPosts(postsResponse.data || []);
        setTotalPages(Math.ceil((postsResponse.data?.length || 0) / 6));
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    if (profile) {
      loadPosts();
    }
  }, [profile, currentPage, activeTab, username]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const handleMessageClick = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setIsChatOpen(true);
    setIsChatMinimized(false);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  const handleChatMinimize = (minimize) => {
    setIsChatMinimized(minimize);
  };

  const handleEditProfile = () => {
    navigate(`/profile/${username}/edit`);
  };

  const handleOpenFollowModal = async (type) => {
    if (!user?.id) return;
    setFollowModal(type);
    setFollowList([]);
    setFollowListLoading(true);
    try {
      const fn = type === "followers"
        ? userService.getFollowersList
        : userService.getFollowingList;
      const result = await fn(user.id);
      setFollowList(result?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setFollowListLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await userService.toggleFollower(user?.id);

      const toggle = !isFollow;

      setIsFollow(toggle);
      setFollowers((prev) => {
        return toggle ? prev + 1 : prev - 1;
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className={styles.profile}>
        <div className="container">
          <Loading size="md" text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.profile}>
        <div className="container">
          <EmptyState
            title="Profile not found"
            description="The user profile you're looking for doesn't exist or has been removed."
            icon="👤"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      {/* Cover Section */}
      <div className={styles.coverSection}>
        <div className={styles.coverImage}>
          <div className={styles.coverImage}>
            <FallbackImage
              src={
                isHttps(profile?.cover_image)
                  ? profile?.cover_image
                  : `${import.meta.env.VITE_BASE_URL}/${profile?.cover_image}`
              }
              alt="Cover"
            />
            <div className={styles.coverOverlay}></div>
          </div>
          <div className={styles.coverOverlay}></div>
        </div>

        <div className={styles.profileHeader}>
          <div className="container">
            <div className={styles.headerContent}>
              <div className={styles.avatarSection}>
                <FallbackImage
                  src={
                    isHttps(profile?.avatar)
                      ? profile?.avatar
                      : `${import.meta.env.VITE_BASE_URL}/${profile?.avatar}`
                  }
                  alt={profile?.username}
                  className={styles.avatar}
                />
                <div className={styles.basicInfo}>
                  <h1 className={styles?.username}>{profile?.username}</h1>
                  <p className={styles.username}>@{profile?.username}</p>
                  {profile.title && (
                    <p className={styles.title}>{profile.title}</p>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                {isOwnProfile ? (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isFollow ? "secondary" : "primary"}
                      size="md"
                      onClick={handleFollow}
                    >
                      {isFollow ? "UnFollow" : "Follow"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={handleMessageClick}
                    >
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container">
        <div className={styles.content}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Bio */}
            {profile.about && (
              <div className={styles.bioCard}>
                <h3>About</h3>
                <p>{profile.about}</p>
              </div>
            )}
            {/* Stats */}
            {/* // Cập nhật lại phần statsCard */}
            <div className={styles.statsCard}>
              <h3>Stats</h3>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <strong>{profile.stats?.posts_count || 0}</strong>
                  <span>Posts</span>
                </div>
                <button
                  className={styles.stat}
                  onClick={() => handleOpenFollowModal("followers")}
                >
                  <strong>{followers}</strong>
                  <span>Followers</span>
                </button>
                <button
                  className={styles.stat}
                  onClick={() => handleOpenFollowModal("following")}
                >
                  <strong>{profile.stats?.following || 0}</strong>
                  <span>Following</span>
                </button>
                <div className={styles.stat}>
                  <strong>{profile.stats?.likes || 0}</strong>
                  <span>Likes</span>
                </div>
              </div>
            </div>
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className={styles.skillsCard}>
                <h3>Skills</h3>
                <div className={styles.skills}>
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={`${skill}-${index}`}
                      variant="secondary"
                      size="sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Badges */}
            {profile.badges && profile.badges.length > 0 && (
              <div className={styles.badgesCard}>
                <h3>Achievements</h3>
                <div className={styles.badges}>
                  {profile.badges.map((badge, index) => (
                    <div
                      key={`${badge.name}-${index}`}
                      className={styles.badge}
                    >
                      <span className={styles.badgeIcon}>{badge.icon}</span>
                      <span className={styles.badgeName}>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Additional Info */}
            <div className={styles.infoCard}>
              <h3>Info</h3>
              <div className={styles.infoItems}>
                {profile.location && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>📍</span>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>🌐</span>
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📅</span>
                  <span>Joined {formatDate(profile.joinedDate)}</span>
                </div>
              </div>
            </div>
            {/* Social Links */}
            {profile.social &&
              (profile.social.twitter ||
                profile.social.github ||
                profile.social.linkedin) && (
                <div className={styles.socialCard}>
                  <h3>Connect</h3>
                  <div className={styles.socialLinks}>
                    {profile.social.twitter && (
                      <a
                        href={
                          profile.social.twitter.startsWith("http")
                            ? profile.social.twitter
                            : `https://twitter.com/${profile.social.twitter}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>🐦</span> Twitter
                      </a>
                    )}
                    {profile.social.github && (
                      <a
                        href={
                          profile.social.github.startsWith("http")
                            ? profile.social.github
                            : `https://github.com/${profile.social.github}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>🐙</span> GitHub
                      </a>
                    )}
                    {profile.social.linkedin && (
                      <a
                        href={
                          profile.social.linkedin.startsWith("http")
                            ? profile.social.linkedin
                            : `https://linkedin.com/in/${profile.social.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>💼</span> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${
                  activeTab === "posts" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("posts")}
              >
                Posts ({profile?.posts_count})
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "about" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "posts" && (
                <div className={styles.postsTab}>
                  <PostList
                    posts={posts}
                    loading={postsLoading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    layout="grid"
                  />
                </div>
              )}

              {activeTab === "about" && (
                <div className={styles.aboutTab}>
                  <AuthorInfo
                    user={{
                      first_name: profile?.first_name,
                      last_name: profile?.last_name,
                      username: profile?.username,
                      social: {
                        twitter: profile?.twitter_url,
                        github: profile?.github_url,
                        linkedin: profile?.linkedin_url,
                        website: profile?.website_url,
                      },
                      title: profile.title,
                      bio: profile.bio,
                      avatar: profile.avatar,

                      posts_count: profile.stats.posts_count,
                      followers: profile.stats.followers,
                      following: profile.stats.following,
                    }}
                    showFollowButton={false}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {!isOwnProfile && currentUser && (
        <ChatWindow
          user={{
            name: profile.name,
            avatar: profile.avatar,
            username: profile.username,
            userId: user.id,
          }}
          isOpen={isChatOpen}
          isMinimized={isChatMinimized}
          onClose={handleChatClose}
          onMinimize={handleChatMinimize}
        />
      )}

      {followModal && (
        <FollowListModal
          title={followModal === "followers" ? "Followers" : "Following"}
          users={followList}
          loading={followListLoading}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
};

export default Profile;
