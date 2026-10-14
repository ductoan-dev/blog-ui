import { useState, useEffect } from "react";
import TopicList from "../../components/TopicList/TopicList";
import Loading from "../../components/Loading/Loading";
import styles from "./TopicsListing.module.scss";
import topicService from "../../services/topicService";
import { useAuth } from "../../context/AuthContext";

const TopicsListing = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const { isAuthenticated } = useAuth() || {};

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const dataTopic = await topicService.getListTopic();
        setTopics(dataTopic.data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleOpenModal = () => {
    setForm({ name: "", description: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Tên topic không được để trống");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const res = await topicService.createTopic({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      const newTopic = res?.data;
      if (newTopic) {
        setTopics((prev) => [newTopic, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : "Tạo topic thất bại");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.topicsListing}>
        <div className="container">
          <Loading size="md" text="Loading topics..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.topicsListing}>
      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>All Topics</h1>
              <p className={styles.description}>
                Explore all available topics and find content that interests you.
              </p>
            </div>
            {isAuthenticated && (
              <button className={styles.createBtn} onClick={handleOpenModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Thêm topic
              </button>
            )}
          </div>
        </header>

        {/* Topics Grid */}
        <section className={styles.content}>
          <TopicList topics={topics} loading={loading} maxTopics={topics.length || 100} />
        </section>
      </div>

      {/* Create Topic Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Tạo topic mới</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)} aria-label="Đóng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Tên topic <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="ví dụ: React, Machine Learning..."
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  autoFocus
                  maxLength={80}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Mô tả</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Mô tả ngắn về topic này..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  maxLength={300}
                />
              </div>

              {formError && <p className={styles.error}>{formError}</p>}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Đang tạo..." : "Tạo topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsListing;
