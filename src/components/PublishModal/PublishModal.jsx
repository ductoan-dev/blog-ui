import { useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import Button from "../Button/Button";
import Input from "../Input/Input";
import Badge from "../Badge/Badge";
import FallbackImage from "../FallbackImage/FallbackImage";
import styles from "./PublishModal.module.scss";

const PublishModal = ({
    isOpen,
    onClose,
    onPublish,
    formData,
    setFormData,
    selectedTopics,
    topicInput,
    setTopicInput,
    availableTopics,
    handleAddTopic,
    handleRemoveTopic,
    handleImageUpload,
    isPublishing = false,
}) => {
    const [isScheduled, setIsScheduled] = useState(false);
    const [publishDate, setPublishDate] = useState("");

    const visibilityOptions = [
        {
            value: "public",
            label: "Public",
            description: "Anyone on the internet can see this post",
            icon: "🌍",
        },
        {
            value: "followers",
            label: "Followers only",
            description: "Only people who follow you can see this post",
            icon: "👥",
        },
        {
            value: "private",
            label: "Only me",
            description: "Only you can see this post",
            icon: "🔒",
        },
    ];

    const handleVisibilityChange = (visibility) => {
        setFormData((prev) => ({
            ...prev,
            visibility,
        }));
    };

    const handlePublish = () => {
        const publishData = {
            ...formData,
            isScheduled,
            publishDate: isScheduled ? publishDate : null,
        };
        onPublish(publishData);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Ready to publish?</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Meta Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>SEO & Meta</h3>

                        <Input
                            label="Meta Title"
                            placeholder="SEO-friendly title (recommended: 50-60 characters)"
                            value={formData.meta_title || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    meta_title: e.target.value,
                                }))
                            }
                            fullWidth
                            maxLength={60}
                        />

                        <Input
                            label="Meta Description"
                            placeholder="Brief description for search engines (recommended: 150-160 characters)"
                            value={formData.meta_description || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    meta_description: e.target.value,
                                }))
                            }
                            fullWidth
                            maxLength={160}
                            rows={3}
                            multiline
                        />
                    </div>

                    {/* Cover Image */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Cover Image</h3>

                        {formData.previewThumbnail ? (
                            <div className={styles.imagePreview}>
                                <FallbackImage
                                    src={formData.previewThumbnail}
                                    alt="Cover preview"
                                    className={styles.coverImage}
                                />
                                <div className={styles.imageActions}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className={styles.fileInput}
                                        id="cover-upload-modal"
                                    />
                                    <label
                                        htmlFor="cover-upload-modal"
                                        className={styles.changeImageButton}
                                    >
                                        Change
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                thumbnail: null,
                                                previewThumbnail: "",
                                            }))
                                        }
                                        className={styles.removeImageButton}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.uploadArea}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className={styles.fileInput}
                                    id="cover-upload-modal"
                                />
                                <label
                                    htmlFor="cover-upload-modal"
                                    className={styles.uploadButton}
                                >
                                    Upload Cover Image
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Topics */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Topics</h3>

                        <div className={styles.topicsInput}>
                            <input
                                type="text"
                                placeholder="Add topics..."
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        topicInput.trim()
                                    ) {
                                        e.preventDefault();
                                        handleAddTopic(topicInput.trim());
                                    }
                                }}
                                className={styles.topicInput}
                            />

                            <div className={styles.topicSuggestions}>
                                {topicInput &&
                                    availableTopics
                                        .filter(
                                            (topic) =>
                                                topic
                                                    .toLowerCase()
                                                    .includes(
                                                        topicInput.toLowerCase()
                                                    ) &&
                                                !selectedTopics.includes(topic)
                                        )
                                        .slice(0, 5)
                                        .map((topic) => (
                                            <button
                                                key={topic}
                                                type="button"
                                                className={
                                                    styles.suggestionItem
                                                }
                                                onClick={() =>
                                                    handleAddTopic(topic)
                                                }
                                            >
                                                {topic}
                                            </button>
                                        ))}
                            </div>
                        </div>

                        <div className={styles.selectedTopics}>
                            {selectedTopics.map((topic) => (
                                <Badge
                                    key={topic}
                                    variant="secondary"
                                    className={styles.topicBadge}
                                >
                                    {topic}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTopic(topic)}
                                        className={styles.removeTopic}
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Post Visibility</h3>

                        <div className={styles.visibilityOptions}>
                            {visibilityOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`${styles.visibilityOption} ${
                                        formData.visibility === option.value
                                            ? styles.selected
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleVisibilityChange(option.value)
                                    }
                                >
                                    <div className={styles.optionHeader}>
                                        <span className={styles.optionIcon}>
                                            {option.icon}
                                        </span>
                                        <span className={styles.optionLabel}>
                                            {option.label}
                                        </span>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value={option.value}
                                            checked={
                                                formData.visibility ===
                                                option.value
                                            }
                                            onChange={() =>
                                                handleVisibilityChange(
                                                    option.value
                                                )
                                            }
                                            className={styles.visibilityRadio}
                                        />
                                    </div>
                                    <p className={styles.optionDescription}>
                                        {option.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Publishing Schedule */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Publishing</h3>

                        <div className={styles.scheduleToggle}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={isScheduled}
                                    onChange={(e) =>
                                        setIsScheduled(e.target.checked)
                                    }
                                    className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                                <span className={styles.toggleText}>
                                    Schedule for later
                                </span>
                            </label>
                        </div>

                        {isScheduled && (
                            <div className={styles.scheduleDateTime}>
                                <Input
                                    label="Publish Date & Time"
                                    type="datetime-local"
                                    value={publishDate}
                                    onChange={(e) =>
                                        setPublishDate(e.target.value)
                                    }
                                    min={new Date().toISOString().slice(0, 16)}
                                    fullWidth
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handlePublish}
                        loading={isPublishing}
                        disabled={isPublishing || (isScheduled && !publishDate)}
                    >
                        {isScheduled ? "Schedule Post" : "Publish Now"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

PublishModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    selectedTopics: PropTypes.array.isRequired,
    topicInput: PropTypes.string.isRequired,
    setTopicInput: PropTypes.func.isRequired,
    availableTopics: PropTypes.array.isRequired,
    handleAddTopic: PropTypes.func.isRequired,
    handleRemoveTopic: PropTypes.func.isRequired,
    handleImageUpload: PropTypes.func.isRequired,
    isPublishing: PropTypes.bool,
};

export default PublishModal;
