import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import Button from "../../components/Button/Button";
import BlogContent from "../../components/BlogContent/BlogContent";
import RichTextEditor from "../../components/RichTextEditor/RichTextEditor";
import PublishModal from "../../components/PublishModal/PublishModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./WritePost.module.scss";
import dayjs from "dayjs";
import topicService from "../../services/topicService";
import postService from "../../services/postService";
import mediaService from "../../services/mediaService";
import resolveMediaUrl from "../../utils/resolveMediaUrl";

const WORDS_PER_MINUTE = 200;
// Khớp giới hạn ở blog-api/src/middlewares/upload.js
const MEDIA_LIMITS = {
  image: { maxSizeMb: 10, label: "Image" },
  video: { maxSizeMb: 100, label: "Video" },
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, " ");

// A post with only an image/video (no text) still has content
const hasMedia = (html) => /<(img|video|iframe)\b/i.test(html);

// Textarea grows with its content so title/excerpt read like the final post
const autoResize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const WritePost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(slug);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    thumbnail: null, // Sẽ lưu File object
    previewThumbnail: "", // Dùng để preview ảnh
    topics: [],
    status: "draft",
    visibility: "public",
    meta_title: "",
    meta_description: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [topics, setTopics] = useState([]);
  // { kind, percent } while an image/video uploads, null otherwise
  const [mediaUpload, setMediaUpload] = useState(null);

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    (async () => {
      const result = await topicService.getListTopic();
      const topics = result.data.map((item) => item.name);
      setTopics(topics);
    })();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const mockPost = {
        title: "Getting Started with React Hooks",
        description:
          "Learn the fundamentals of React Hooks and how they can simplify your component logic.",
        content:
          "# Getting Started with React Hooks\n\nReact Hooks revolutionized how we write components...",
        previewThumbnail:
          "https://via.placeholder.com/800x400?text=React+Hooks",
        topics: ["React", "JavaScript"],
        status: "draft",
        visibility: "public",
        meta_title: "Getting Started with React Hooks - Complete Guide",
        meta_description:
          "Comprehensive guide to React Hooks, covering useState, useEffect, and custom hooks with practical examples and best practices.",
      };
      setFormData((prev) => ({
        ...prev,
        ...mockPost,
      }));
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    autoResize(titleRef.current);
    autoResize(descriptionRef.current);
  }, [formData.title, formData.description, previewMode]);

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleInputChange = (field) => (e) => updateField(field, e.target.value);

  // Enter moves focus to the next field instead of inserting a newline
  const focusOnEnter = (next) => (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      next()?.focus();
    }
  };

  const handleAddTopic = (topic) => {
    if (topic && !formData.topics.includes(topic)) {
      updateField("topics", [...formData.topics, topic]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    updateField(
      "topics",
      formData.topics.filter((topic) => topic !== topicToRemove)
    );
  };

  const plainContent = stripHtml(formData.content).trim();
  const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Excerpt is required";
    if (!plainContent && !hasMedia(formData.content))
      newErrors.content = "Content is required";

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    // Errors are only visible in write mode
    if (!isValid) setPreviewMode(false);
    return isValid;
  };

  const buildFormData = (data, status = "draft") => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("description", data.description);
    form.append("content", data.content);
    form.append("status", status);
    form.append("visibility", data.visibility);
    form.append("meta_title", data.meta_title);
    form.append("meta_description", data.meta_description);
    form.append("topics", JSON.stringify(data.topics));

    if (data.isScheduled) {
      const now = dayjs(data.publishDate);
      const formatted = now.format("YYYY-MM-DD HH:mm:ss");
      form.append("published_at", formatted);
    }

    if (data.thumbnail instanceof File) {
      form.append("thumbnail", data.thumbnail);
    }

    return form;
  };

  const submitPost = async (data, status) => {
    // Ctrl+S also lands here, so block saving mid-upload
    if (saving || mediaUpload !== null || !validateForm()) return;
    setSaving(true);
    try {
      await postService.create(buildFormData(data, status));
      setIsDirty(false);
      setShowPublishModal(false);
      navigate("/my-posts");
    } catch (error) {
      // httpRequest throws the server message as a string
      setErrors((prev) => ({
        ...prev,
        submit: typeof error === "string" ? error : "Could not save your post",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => submitPost(formData, "draft");

  const handlePublish = (publishData) => submitPost(publishData, "published");

  const handleOpenPublishModal = () => {
    if (validateForm()) {
      setShowPublishModal(true);
    }
  };

  // Ctrl/Cmd + S saves the draft
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        thumbnail: file,
        previewThumbnail: previewUrl,
      }));
      setIsDirty(true);
    }
  };

  // Returns the video URL for the editor to embed, or null on failure
  // Returns the uploaded file's URL for the editor to embed, or null on failure
  const handleUploadMedia = async (kind, file) => {
    const { maxSizeMb, label } = MEDIA_LIMITS[kind];
    const showError = (message) => {
      setErrors((prev) => ({ ...prev, submit: message }));
      return null;
    };

    if (!file.type.startsWith(`${kind}/`)) {
      return showError(`Please choose a ${kind} file`);
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return showError(`${label} must be ${maxSizeMb}MB or smaller`);
    }

    setErrors((prev) => ({ ...prev, submit: "" }));
    setMediaUpload({ kind, percent: 0 });
    try {
      const { path } = await mediaService.uploadMedia(kind, file, (percent) =>
        setMediaUpload({ kind, percent })
      );
      // Local: path in uploads/; production: full Vercel Blob URL
      return resolveMediaUrl(path);
    } catch (error) {
      return showError(
        typeof error === "string" ? error : `Could not upload ${kind}`
      );
    } finally {
      setMediaUpload(null);
    }
  };

  const isUploading = mediaUpload !== null;

  const viewModes = [
    { label: "Write", value: false },
    { label: "Preview", value: true },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.status}>
            <span className={styles.statusLabel}>
              {isEditing ? "Editing" : "Draft"}
            </span>
            <span className={styles.stats}>
              {wordCount} words · {readingTime} min read
            </span>
            {isUploading ? (
              <span className={styles.uploading} role="status">
                Uploading {mediaUpload.kind} {mediaUpload.percent}%
              </span>
            ) : (
              isDirty && <span className={styles.unsaved}>Unsaved changes</span>
            )}
          </div>

          <div className={styles.viewToggle} role="tablist">
            {viewModes.map((mode) => (
              <button
                key={mode.label}
                type="button"
                role="tab"
                aria-selected={previewMode === mode.value}
                className={clsx(styles.toggleButton, {
                  [styles.active]: previewMode === mode.value,
                })}
                onClick={() => setPreviewMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className={styles.saveActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              loading={saving && !showPublishModal}
              disabled={saving || isUploading}
              title="Ctrl + S"
            >
              Save draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenPublishModal}
              disabled={saving || isUploading}
            >
              {isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </div>

        {errors.submit && (
          <p className={styles.submitError} role="alert">
            {errors.submit}
          </p>
        )}
      </header>

      <main className={styles.page}>
        {!previewMode ? (
          <div className={styles.editor}>
            <div className={styles.field}>
              <textarea
                ref={titleRef}
                rows={1}
                className={clsx(styles.titleInput, {
                  [styles.invalid]: errors.title,
                })}
                placeholder="Post title"
                aria-label="Post title"
                aria-invalid={Boolean(errors.title)}
                value={formData.title}
                onChange={handleInputChange("title")}
                onKeyDown={focusOnEnter(() => descriptionRef.current)}
                autoFocus={!isEditing}
              />
              {errors.title && (
                <p className={styles.errorText}>{errors.title}</p>
              )}
            </div>

            <div className={styles.field}>
              <textarea
                ref={descriptionRef}
                rows={1}
                className={clsx(styles.excerptInput, {
                  [styles.invalid]: errors.description,
                })}
                placeholder="Write a short excerpt that hooks your readers..."
                aria-label="Excerpt"
                aria-invalid={Boolean(errors.description)}
                value={formData.description}
                onChange={handleInputChange("description")}
                onKeyDown={focusOnEnter(() => editorRef.current)}
              />
              {errors.description && (
                <p className={styles.errorText}>{errors.description}</p>
              )}
            </div>

            <RichTextEditor
              ref={editorRef}
              value={formData.content}
              onChange={(value) => updateField("content", value)}
              onUploadMedia={handleUploadMedia}
              placeholder="Tell your story..."
              error={errors.content}
              className={styles.richTextEditor}
            />
          </div>
        ) : (
          <BlogContent
            title={formData.title || "Untitled post"}
            description={formData.description}
            content={formData.content}
            thumbnail={formData.previewThumbnail}
            user={user}
            public_at={new Date().toISOString()}
            readTime={readingTime}
            tags={formData.topics}
          />
        )}
      </main>

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        formData={formData}
        setFormData={setFormData}
        selectedTopics={formData.topics}
        topicInput={topicInput}
        setTopicInput={setTopicInput}
        availableTopics={topics}
        handleAddTopic={handleAddTopic}
        handleRemoveTopic={handleRemoveTopic}
        handleImageUpload={handleImageUpload}
        isPublishing={saving}
      />
    </div>
  );
};

export default WritePost;
