import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import FallbackImage from "../FallbackImage/FallbackImage";
import Button from "../Button/Button";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import messengerService from "../../services/messengerService";
import * as socketService from "../../services/socketService";
import isHttps from "../../utils/isHttps";
import styles from "./ChatWindow.module.scss";

const resolveAvatar = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const ChatWindow = ({ user, isOpen = false, onClose, onMinimize, isMinimized = false, ...props }) => {
  const navigate = useNavigate();
  const { socket } = useSocket() || {};
  const { user: authUser } = useAuth() || {};
  // authUser is the user object directly: { id, username, ... }
  const me = authUser?.id || "";

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const convIdRef = useRef(null);

  // Keep ref in sync for socket callbacks
  useEffect(() => { convIdRef.current = conversationId; }, [conversationId]);

  // ── Init conversation when chat opens ───────────────────────
  useEffect(() => {
    if (!isOpen || !user?.userId) return;

    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setConversationId(null);

    (async () => {
      try {
        const res = await messengerService.getOrCreateDirect(user.userId);
        const conv = res?.data?.data || res?.data;
        if (cancelled || !conv?.id) return;

        const cid = conv.id;
        setConversationId(cid);
        socketService.joinConversation(cid);

        const msgRes = await messengerService.getMessages(cid);
        if (cancelled) return;
        // httpRequest.send returns res.data already, so msgRes = { succsess, data: [...] }
        const msgs = msgRes?.data || [];
        setMessages(msgs);
      } catch (err) {
        console.error("ChatWindow init error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (convIdRef.current) socketService.leaveConversation(convIdRef.current);
    };
  }, [isOpen, user?.userId]);

  // ── Socket: receive new messages ─────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onNewMsg = ({ conversationId: cid, message: msg }) => {
      if (cid !== convIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    socket.on("new_message", onNewMsg);
    return () => socket.off("new_message", onNewMsg);
  }, [socket]);

  // ── Scroll to bottom ─────────────────────────────────────────
  useEffect(() => {
    if (!isMinimized && messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  }, [messages, isMinimized]);

  // ── Close menu on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !conversationId || sending) return;

    setSending(true);
    setMessage("");

    try {
      let sent;
      try {
        sent = await socketService.sendMessageSocket(conversationId, text);
      } catch {
        const res = await messengerService.sendMessage(conversationId, text);
        sent = res?.data?.data || res?.data;
      }
      if (sent) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
      }
    } catch (err) {
      console.error("Send failed:", err);
      setMessage(text); // restore on failure
    } finally {
      setSending(false);
    }
  }, [message, conversationId, sending]);

  const handleOpenInMessages = () => {
    const dest = conversationId ? `/messages?conversation=${conversationId}` : "/messages";
    navigate(dest);
    onClose();
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  // Backend populates user_id → msg.user { _id, username, avatar, ... }
  const isOwn = (msg) => {
    const sid = msg.user?.id;
    return !!sid && sid === me;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className={styles.minimizedWindow} onClick={() => onMinimize(false)}>
        <FallbackImage src={resolveAvatar(user?.avatar)} alt={user?.name} className={styles.minimizedAvatar} />
        <span className={styles.minimizedName}>{user?.name}</span>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow} {...props}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <FallbackImage src={resolveAvatar(user?.avatar)} alt={user?.name} className={styles.avatar} />
          <div className={styles.userDetails}>
            <span className={styles.name}>{user?.name}</span>
            <span className={styles.status}>
              {loading ? "Đang tải..." : conversationId ? "Đã kết nối" : ""}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.menuContainer} ref={menuRef}>
            <button className={styles.menuButton} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="More options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className={styles.menu}>
                <button className={styles.menuItem} onClick={handleOpenInMessages}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  Mở trong Messages
                </button>
              </div>
            )}
          </div>

          <button className={styles.minimizeButton} onClick={() => onMinimize(true)} aria-label="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h12v2H6z" /></svg>
          </button>

          <button className={styles.closeButton} onClick={onClose} aria-label="Close chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {loading && (
          <div className={styles.loadingState}>
            <span>Đang tải tin nhắn...</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className={styles.emptyState}>
            <span>Hãy bắt đầu cuộc trò chuyện!</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const own = isOwn(msg);
          return (
            <div key={msg.id || i} className={`${styles.message} ${own ? styles.own : styles.other}`}>
              {!own && (
                <FallbackImage
                  src={resolveAvatar(msg.sender?.avatar)}
                  alt={msg.sender?.username}
                  className={styles.msgAvatar}
                />
              )}
              <div className={styles.messageContent}>
                <p className={styles.messageText}>{msg.content || msg.text}</p>
                <span className={styles.messageTime}>{formatTime(msg.createdAt || msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className={styles.inputForm} onSubmit={handleSend}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className={styles.input}
          disabled={!conversationId || sending}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!message.trim() || !conversationId || sending}
          className={styles.sendButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </Button>
      </form>
    </div>
  );
};

ChatWindow.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    username: PropTypes.string,
    userId: PropTypes.string.isRequired,
  }).isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func.isRequired,
  isMinimized: PropTypes.bool,
};

export default ChatWindow;
