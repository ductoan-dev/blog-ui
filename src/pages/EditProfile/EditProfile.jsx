import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Card from "../../components/Card/Card";
import FallbackImage from "../../components/FallbackImage/FallbackImage";
import styles from "./EditProfile.module.scss";

// import isHttps from "../../utils/isHttps";
import useUser from "../../hook/useUser";
import userService from "../../services/userService";

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);

  // Mock current user data - trong thực tế sẽ fetch từ API hoặc context
  const { currentUser } = useUser();

  console.log(settings);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser?.data);
      if (currentUser.data.settings) {
        setSettings(JSON.parse(currentUser.data.settings.data));
      }
    }
  }, [currentUser]);

  const [formData, setFormData] = useState({
    fullname: user?.fullname || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
    title: user?.title || "",
    bio: user?.about || "",
    location: user?.location || "",
    website_url: user?.website_url || "",
    avatar: user?.avatar || "",
    cover_image: user?.cover_image || "",
    social: {
      twitter_url: user?.twitter_url || "",
      github_url: user?.github_url || "",
      linkedin_url: user?.linkedin_url || "",
    },
    skills:
      typeof user?.skills === "string"
        ? JSON.parse(user?.skills || null)?.join(", ") || ""
        : [],

    privacy: {
      profileVisibility: "public", // public, private
      showEmail: false,
      showFollowersCount: true,
      showFollowingCount: true,
      allowDirectMessages: true,
      showOnlineStatus: true,
    },
  });

  const [imageFiles, setImageFiles] = useState({});

  const [imagePreviews, setImagePreviews] = useState({});

  useEffect(() => {
    setFormData({
      fullname: user?.fullname || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      username: user?.username || "",
      title: user?.title || "",
      bio: user?.about || "",
      location: user?.location || "",
      website_url: user?.website_url || "",
      avatar: user?.avatar || "",
      cover_image: user?.cover_image || "",
      social: {
        twitter_url: user?.twitter_url || "",
        github_url: user?.github_url || "",
        linkedin_url: user?.linkedin_url || "",
      },
      skills:
        typeof user?.skills === "string"
          ? JSON.parse(user?.skills || null)?.join(", ") || ""
          : [],

      privacy: {
        profileVisibility: settings?.defaultPostVisibility || "public", // public, private
        showEmail: settings?.showEmail || false,
        showFollowersCount: true,
        showFollowingCount: true,
        allowDirectMessages: true,
        showOnlineStatus: true,
      },
    });

    setImagePreviews({
      avatar: user?.avatar,
      cover_image: user?.cover_image,
    });
    setImageFiles({
      avatar: user?.avatar,
      cover_image: user?.cover_image,
    });
  }, [user, settings]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.startsWith("social.")) {
      const socialField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        social: {
          ...prev.social,
          [socialField]: value,
        },
      }));
    } else if (field.startsWith("privacy.")) {
      const privacyField = field.split(".")[1];
      setFormData((prev) => {
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            [privacyField]: value,
          },
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageChange = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Please select a valid image file",
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Image size must be less than 5MB",
      }));
      return;
    }

    // Clear previous error
    setErrors((prev) => ({
      ...prev,
      [type]: "",
    }));

    // Store file
    setImageFiles((prev) => ({
      ...prev,
      [type]: file,
    }));

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews((prev) => ({
        ...prev,
        [type]: e.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = "Fullname is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, hyphens and underscores";
    }

    if (formData.website_url && !formData.website_url.startsWith("http")) {
      newErrors.website_url = "Website URL must start with http:// or https://";
    }

    // if (
    //   formData.social.twitter_url &&
    //   !formData.social.twitter_url.startsWith("https://twitter_url.com/")
    // ) {
    //   newErrors["social.twitter_url"] =
    //     "Twitter URL must be a valid Twitter profile URL";
    // }

    // if (
    //   formData.social.github_url &&
    //   !formData.social.github_url.startsWith("https://github")
    // ) {
    //   newErrors["social.github_url"] =
    //     "GitHub URL must be a valid GitHub profile URL";
    // }

    // if (
    //   formData.social.linkedin_url &&
    //   !formData.social.linkedin_url.startsWith("https://linkedin_url.com/")
    // ) {
    //   newErrors["social.linkedin_url"] =
    //     "LinkedIn URL must be a valid LinkedIn profile URL";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Tạo FormData để gửi cả file và text data
      const formDataToSend = new FormData();

      if (imageFiles.avatar instanceof File) {
        formDataToSend.append("avatar", imageFiles.avatar);
      }

      if (imageFiles.cover_image instanceof File) {
        formDataToSend.append("cover_image", imageFiles.cover_image);
      }

      // Thêm text data
      formDataToSend.append(
        "fullname",
        formData.fullname || `${formData.first_name} ${formData.last_name}`
      );
      formDataToSend.append("username", formData.username);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("about", formData.bio);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("website_url", formData.website_url);

      // Thêm social links (convert object thành JSON string)
      // formDataToSend.append("social", JSON.stringify(formData.social));

      formDataToSend.append("twitter_url", formData.social.twitter_url);
      formDataToSend.append("github_url", formData.social.github_url);
      formDataToSend.append("linkedin_url", formData.social.linkedin_url);

      // Thêm skills (convert array)
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
      formDataToSend.append("skills", JSON.stringify(skillsArray));

      // Thêm privacy settings
      formDataToSend.append("privacy", JSON.stringify(formData.privacy));

      // Debug FormData
      console.log("Sending data:");
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}:`, {
            name: pair[1].name,
            size: pair[1].size,
            type: pair[1].type,
          });
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }

      const result = await userService.editProfile(formDataToSend);

      console.log("Response:", result);

      // Navigate back to profile with success message
      navigate(`/profile/${formData.username}`, {
        state: { message: "Profile updated successfully!" },
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrors({ submit: "Failed to save profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className={styles.editProfilePage}>
      <div className="container">
        <div className={styles.pageHeader}>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className={styles.backButton}
          >
            ← Back
          </Button>
          <h1>Edit Profile</h1>
          <p>Update your profile information and settings</p>
        </div>

        <Card className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Profile Images */}
            <div className={styles.section}>
              <h3>Profile Images</h3>
              <div className={styles.imageSection}>
                <div className={styles.imagePreview}>
                  <div className={styles.coverPreview}>
                    <FallbackImage
                      src={
                        imagePreviews.cover_image?.startsWith("http") ||
                        imagePreviews.cover_image?.startsWith("data:")
                          ? imagePreviews.cover_image
                          : `${import.meta.env.VITE_BASE_URL}/${
                              imagePreviews.cover_image
                            }`
                      }
                      alt="Cover preview"
                      className={styles.coverImg}
                    />
                    <div className={styles.imageUpload}>
                      <input
                        type="file"
                        id="cover_image"
                        accept="image/*"
                        onChange={(e) => handleImageChange("cover_image", e)}
                        className={styles.fileInput}
                      />
                      <label
                        htmlFor="cover_image"
                        className={styles.uploadButton}
                      >
                        📷 Change Cover
                      </label>
                    </div>
                    <span className={styles.imageLabel}>Cover Image</span>
                    {errors.cover_image && (
                      <div className={styles.imageError}>
                        {errors.cover_image}
                      </div>
                    )}
                  </div>

                  <div className={styles.avatarPreview}>
                    <FallbackImage
                      src={
                        imagePreviews.avatar?.startsWith("http") ||
                        imagePreviews.avatar?.startsWith("data:")
                          ? imagePreviews.avatar
                          : `${import.meta.env.VITE_BASE_URL}/${
                              imagePreviews.avatar
                            }`
                      }
                      alt="Avatar preview"
                      className={styles.avatarImg}
                    />
                    <div className={styles.imageUpload}>
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={(e) => handleImageChange("avatar", e)}
                        className={styles.fileInput}
                      />
                      <label htmlFor="avatar" className={styles.uploadButton}>
                        📷 Change
                      </label>
                    </div>
                    <span className={styles.imageLabel}>Avatar</span>
                    {errors.avatar && (
                      <div className={styles.imageError}>{errors.avatar}</div>
                    )}
                  </div>
                </div>

                <div className={styles.imageHints}>
                  <p>
                    <strong>Avatar:</strong> Recommended 400x400px, max 5MB
                  </p>
                  <p>
                    <strong>Cover:</strong> Recommended 1200x300px, max 5MB
                  </p>
                  <p>Supported formats: JPG, PNG, GIF</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className={styles.section}>
              <h3>Basic Information</h3>
              <div className={styles.grid}>
                <Input
                  label="Full Name"
                  value={
                    formData?.fullname ||
                    `${formData?.first_name} ${formData?.last_name}`
                  }
                  onChange={(e) =>
                    handleInputChange("fullname", e.target.value)
                  }
                  error={errors.name}
                  required
                  fullWidth
                />
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  error={errors.username}
                  required
                  fullWidth
                />
              </div>

              <Input
                label="Professional Title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                fullWidth
              />

              <div className={styles.textareaContainer}>
                <label className={styles.textareaLabel}>Bio</label>
                <textarea
                  className={styles.textarea}
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.section}>
              <h3>Contact Information</h3>
              <div className={styles.grid}>
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="e.g. San Francisco, CA"
                  fullWidth
                />
                <Input
                  label="Website"
                  value={formData.website_url}
                  onChange={(e) =>
                    handleInputChange("website_url", e.target.value)
                  }
                  placeholder="https://yourwebsite_url.com"
                  error={errors.website_url}
                  fullWidth
                />
              </div>
            </div>

            {/* Social Links */}
            <div className={styles.section}>
              <h3>Social Links</h3>
              <Input
                label="Twitter"
                value={formData?.social?.twitter_url}
                onChange={(e) =>
                  handleInputChange("social.twitter_url", e.target.value)
                }
                placeholder="https://twitter_url.com/username"
                error={errors["social.twitter_url"]}
                fullWidth
              />
              <Input
                label="GitHub"
                value={formData?.social?.github_url}
                onChange={(e) =>
                  handleInputChange("social.github_url", e.target.value)
                }
                placeholder="https://github_url.com/username"
                error={errors["social.github_url"]}
                fullWidth
              />
              <Input
                label="LinkedIn"
                value={formData?.social?.linkedin_url}
                onChange={(e) =>
                  handleInputChange("social.linkedin_url", e.target.value)
                }
                placeholder="https://linkedin_url.com/in/username"
                error={errors["social.linkedin_url"]}
                fullWidth
              />
            </div>

            {/* Skills */}
            <div className={styles.section}>
              <h3>Skills</h3>
              <Input
                label="Skills (comma separated)"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="React, TypeScript, Node.js, GraphQL"
                helperText="Separate skills with commas"
                fullWidth
              />
            </div>

            {/* Privacy Settings */}
            <div className={styles.section}>
              <h3>Privacy Settings</h3>
              <div className={styles.privacyControls}>
                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Profile Visibility
                    </label>
                    <p className={styles.privacyDescription}>
                      Control who can view your profile
                    </p>
                  </div>
                  <select
                    value={formData?.privacy?.profileVisibility}
                    onChange={(e) =>
                      handleInputChange(
                        "privacy.profileVisibility",
                        e.target.value
                      )
                    }
                    className={styles.privacySelect}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Show Email Address
                    </label>
                    <p className={styles.privacyDescription}>
                      Display your email on your profile
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData?.privacy?.showEmail}
                    onChange={(e) =>
                      handleInputChange("privacy.showEmail", e.target.checked)
                    }
                    className={styles.privacyToggle}
                  />
                </div>

                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Show Followers Count
                    </label>
                    <p className={styles.privacyDescription}>
                      Display number of followers on your profile
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData?.privacy?.showFollowersCount}
                    onChange={(e) =>
                      handleInputChange(
                        "privacy.showFollowersCount",
                        e.target.checked
                      )
                    }
                    className={styles.privacyToggle}
                  />
                </div>

                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Show Following Count
                    </label>
                    <p className={styles.privacyDescription}>
                      Display number of people you follow
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData?.privacy?.showFollowingCount}
                    onChange={(e) =>
                      handleInputChange(
                        "privacy.showFollowingCount",
                        e.target.checked
                      )
                    }
                    className={styles.privacyToggle}
                  />
                </div>

                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Allow Direct Messages
                    </label>
                    <p className={styles.privacyDescription}>
                      Let other users send you direct messages
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData?.privacy?.allowDirectMessages}
                    onChange={(e) =>
                      handleInputChange(
                        "privacy.allowDirectMessages",
                        e.target.checked
                      )
                    }
                    className={styles.privacyToggle}
                  />
                </div>

                <div className={styles.privacyItem}>
                  <div className={styles.privacyInfo}>
                    <label className={styles.privacyLabel}>
                      Show Online Status
                    </label>
                    <p className={styles.privacyDescription}>
                      Display when you are online to other users
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData?.privacy?.showOnlineStatus}
                    onChange={(e) =>
                      handleInputChange(
                        "privacy.showOnlineStatus",
                        e.target.checked
                      )
                    }
                    className={styles.privacyToggle}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className={styles.actions}>
              {errors.submit && (
                <div className={styles.submitError}>{errors.submit}</div>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={loading}
                size="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                size="lg"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
