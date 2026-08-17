import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import FallbackImage from "../../components/FallbackImage/FallbackImage";
import Loading from "../../components/Loading/Loading";
import styles from "./DirectMessages.module.scss";
import messengerService from "../../services/messengerService";
import userService from "../../services/userService";
import * as socketService from "../../services/socketService";
import { useSocket } from "../../context/SocketContext";
import useUser from "../../hook/useUser";
import isHttps from "../../utils/isHttps";

const resolveAvatar = (src) =>
  src ? (isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`) : null;

const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("vi-VN");
};

const getPartner = (conv, myId) =>
  conv.members?.find((m) => m.id !== myId) ||
  conv.members?.[0];

const getDisplayName = (user) =>
  user?.fullname ||
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.username ||
  "Unknown";

const DirectMessages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { convId: [user, ...] }

  // Compose
  const [showCompose, setShowCompose] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const selectedConvRef = useRef(null);
  const typingTimeout = useRef(null);
  const userSearchTimeout = useRef(null);

  const { currentUser } = useUser();
  const me = currentUser?.data;
  const myId = me?.id;

  // Get socket + unread from global context
  const { socket, connected: socketConnected, markConvRead } = useSocket() || {};

  // Keep ref in sync for socket callbacks
  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);

  // ── Socket event listeners ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Upsert a conversation preview in the list.
    // If the conv is unknown (created in ChatWindow), refresh the full list.
    const upsertConvPreview = (conversationId, message) => {
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => c.id === conversationId
        );
        if (idx >= 0) {
          return prev.map((c, i) =>
            i === idx
              ? { ...c, last_message: message, last_message_at: message.createdAt }
              : c
          );
        }
        // Conversation not in list yet (e.g. created from ChatWindow) — refresh
        messengerService.getConversations()
          .then((r) => { if (r?.data) setConversations(r.data); })
          .catch(() => {});
        return prev;
      });
    };

    const onNewMessage = ({ conversationId, message }) => {
      const currentConvId = selectedConvRef.current?.id;

      // Append to thread if this conversation is open
      if (currentConvId === conversationId) {
        setMessages((prev) => {
          const id = message.id;
          if (prev.some((m) => m.id === id)) return prev;
          return [...prev, message];
        });
      }

      // Always keep conversation list preview in sync (covers ChatWindow sync)
      upsertConvPreview(conversationId, message);
    };

    // notification:new_message fires on personal room for messages in convs
    // the socket hasn't explicitly joined (e.g. no ChatWindow open for that conv)
    const onNotifNewMessage = ({ conversationId, message }) => {
      upsertConvPreview(conversationId, message);
    };

    const onConversationUpdated = ({ conversationId, last_message, last_message_at }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, last_message, last_message_at }
            : c
        )
      );
    };

    const onUserTyping = ({ conversationId, user }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (current.some((u) => u.id === user.id)) return prev;
        return { ...prev, [conversationId]: [...current, user] };
      });
    };

    const onUserStopTyping = ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((u) => u.id !== userId),
      }));
    };

    socket.on("new_message", onNewMessage);
    socket.on("notification:new_message", onNotifNewMessage);
    socket.on("conversation_updated", onConversationUpdated);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("notification:new_message", onNotifNewMessage);
      socket.off("conversation_updated", onConversationUpdated);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
    };
  }, [socket]);

  // ── Load conversations ────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingConvs(true);
        const result = await messengerService.getConversations();
        if (!ignore) setConversations(result?.data || []);
      } catch {
        if (!ignore) setConversations([]);
      } finally {
        if (!ignore) setLoadingConvs(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Open conversation from URL param after list loads
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (!convId || conversations.length === 0) return;
    const found = conversations.find(
      (c) => c.id === convId
    );
    const alreadyOpen = selectedConvRef.current?.id === convId;
    if (found && !alreadyOpen) openConversation(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams]);

  // ── Open / switch conversation ────────────────────────────────
  const openConversation = useCallback(async (conv) => {
    const prevId = selectedConvRef.current?.id;
    const convId = conv.id;

    if (prevId && prevId !== convId) socketService.leaveConversation(prevId);

    setSelectedConv(conv);
    setSearchParams({ conversation: convId });
    setShowCompose(false);
    setMessages([]);
    setLoadingMsgs(true);

    socketService.joinConversation(convId);
    markConvRead?.(convId);

    try {
      const result = await messengerService.getMessages(convId);
      setMessages(result?.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [setSearchParams]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Debounced user search ────────────────────────────────────
  useEffect(() => {
    clearTimeout(userSearchTimeout.current);
    if (!userSearchQuery.trim()) { setUserSearchResults([]); return; }
    userSearchTimeout.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const result = await userService.searchUsers(userSearchQuery);
        setUserSearchResults(result?.data || []);
      } catch {
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);
    return () => clearTimeout(userSearchTimeout.current);
  }, [userSearchQuery]);

  // ── Start / open direct conversation ─────────────────────────
  const handleStartConversation = async (targetUser) => {
    const targetId = targetUser.id;
    try {
      const result = await messengerService.getOrCreateDirect(targetId);
      const conv = result?.data;
      if (!conv) return;
      setConversations((prev) => {
        const exists = prev.find(
          (c) => c.id === conv.id
        );
        return exists ? prev : [conv, ...prev];
      });
      setUserSearchQuery("");
      setUserSearchResults([]);
      openConversation(conv);
    } catch { /* ignore */ }
  };

  // ── Send message (via socket, fallback to HTTP) ───────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    const content = newMessage.trim();
    const convId = selectedConv.id;
    setNewMessage("");
    setSending(true);
    clearTimeout(typingTimeout.current);
    socketService.emitStopTyping(convId);

    try {
      if (socketConnected) {
        // Socket sends, broadcasts, and updates conversation list automatically
        await socketService.sendMessageSocket(convId, content);
      } else {
        // Fallback: HTTP
        const result = await messengerService.sendMessage(convId, content);
        const msg = result?.data;
        if (msg) {
          setMessages((prev) => [...prev, msg]);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, last_message: msg, last_message_at: msg.createdAt }
                : c
            )
          );
        }
      }
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Typing indicator ─────────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const convId = selectedConv?.id;
    if (!convId) return;
    socketService.emitTyping(convId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketService.emitStopTyping(convId);
    }, 2000);
  };

  // ── Derived data ──────────────────────────────────────────────
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const partner = getPartner(conv, myId);
    const q = searchQuery.toLowerCase();
    return (
      getDisplayName(partner).toLowerCase().includes(q) ||
      (partner?.username || "").toLowerCase().includes(q)
    );
  });

  const partner = selectedConv ? getPartner(selectedConv, myId) : null;
  const selectedConvId = selectedConv?.id;
  const whoTyping = (typingUsers[selectedConvId] || []).filter(
    (u) => u.id !== myId
  );

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.title}>Messages</h1>
            <div className={styles.headerRight}>
              {socketConnected && <span className={styles.socketDot} title="Đang kết nối" />}
              <button
                className={styles.composeBtn}
                onClick={() => {
                  setShowCompose((v) => !v);
                  setUserSearchQuery("");
                  setUserSearchResults([]);
                }}
                title="Cuộc trò chuyện mới"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Compose: search users */}
          {showCompose && (
            <div className={styles.composePanel}>
              <input
                className={styles.composeSearch}
                placeholder="Tìm người dùng..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
              />
              <div className={styles.composeResults}>
                {searchingUsers ? (
                  <div className={styles.centerLoading}><Loading size="sm" /></div>
                ) : userSearchResults.length > 0 ? (
                  userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      className={styles.composeUserItem}
                      onClick={() => handleStartConversation(u)}
                    >
                      <FallbackImage
                        src={resolveAvatar(u.avatar)}
                        alt={getDisplayName(u)}
                        className={styles.composeUserAvatar}
                      />
                      <div className={styles.composeUserInfo}>
                        <span className={styles.composeUserName}>{getDisplayName(u)}</span>
                        <span className={styles.composeUserHandle}>@{u.username}</span>
                      </div>
                    </div>
                  ))
                ) : userSearchQuery.trim() ? (
                  <p className={styles.composeEmpty}>Không tìm thấy người dùng</p>
                ) : (
                  <p className={styles.composeEmpty}>Nhập tên hoặc username để tìm</p>
                )}
              </div>
            </div>
          )}

          {!showCompose && (
            <div className={styles.searchSection}>
              <input
                className={styles.searchInput}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className={styles.conversationsList}>
            {loadingConvs ? (
              <div className={styles.centerLoading}><Loading size="sm" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.centerLoading}>
                <p className={styles.emptyHint}>
                  {searchQuery
                    ? "Không tìm thấy cuộc trò chuyện"
                    : "Nhấn + để bắt đầu cuộc trò chuyện mới"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const convId = conv.id;
                const p = getPartner(conv, myId);
                const isSelected = selectedConvId === convId;
                const hasTyping = (typingUsers[convId] || []).length > 0;
                return (
                  <div
                    key={convId}
                    className={`${styles.conversationItem} ${isSelected ? styles.selected : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className={styles.avatarContainer}>
                      <FallbackImage
                        src={resolveAvatar(p?.avatar)}
                        alt={getDisplayName(p)}
                        className={styles.avatar}
                      />
                    </div>
                    <div className={styles.conversationContent}>
                      <div className={styles.conversationHeader}>
                        <span className={styles.participantName}>{getDisplayName(p)}</span>
                        <span className={styles.timestamp}>
                          {formatTime(conv.last_message_at || conv.last_message?.createdAt)}
                        </span>
                      </div>
                      <div className={styles.lastMessage}>
                        <span className={`${styles.messageText} ${hasTyping ? styles.typing : ""}`}>
                          {hasTyping ? "Đang nhập..." : (conv.last_message?.content || "Bắt đầu cuộc trò chuyện")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Messages area ── */}
        <div className={styles.messagesArea}>
          {selectedConv ? (
            <>
              <div className={styles.messagesHeader}>
                <div className={styles.participantInfo}>
                  <FallbackImage
                    src={resolveAvatar(partner?.avatar)}
                    alt={getDisplayName(partner)}
                    className={styles.headerAvatar}
                  />
                  <div>
                    <h2 className={styles.participantName}>{getDisplayName(partner)}</h2>
                    <span className={styles.participantStatus}>
                      {whoTyping.length > 0
                        ? `${getDisplayName(whoTyping[0])} đang nhập...`
                        : `@${partner?.username}`}
                    </span>
                  </div>
                </div>
                {!socketConnected && (
                  <span className={styles.offlineBadge}>Offline — HTTP mode</span>
                )}
              </div>

              <div className={styles.messagesThread}>
                {loadingMsgs ? (
                  <div className={styles.centerLoading}><Loading size="sm" /></div>
                ) : messages.length === 0 ? (
                  <p className={styles.emptyHint} style={{ marginTop: 32, textAlign: "center" }}>
                    Hãy gửi tin nhắn đầu tiên!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const senderId = msg.user?.id;
                    const isMine = senderId === myId;
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.message} ${isMine ? styles.sent : styles.received}`}
                      >
                        <div className={styles.messageContent}>
                          <span className={styles.messageText}>{msg.content}</span>
                          <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Typing bubble */}
                {whoTyping.length > 0 && (
                  <div className={`${styles.message} ${styles.received}`}>
                    <div className={`${styles.messageContent} ${styles.typingBubble}`}>
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.messageInputContainer}>
                <div className={styles.messageInputWrapper}>
                  <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Nhắn tin cho ${getDisplayName(partner)}...`}
                    className={styles.messageInput}
                    rows={1}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className={styles.sendButton}
                    size="sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="dm-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#0055FF" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2C6.48 2 2 6.26 2 11.5c0 2.91 1.35 5.51 3.5 7.26V22l3.34-1.84c.99.28 2.04.44 3.16.44 5.52 0 10-4.26 10-9.5S17.52 2 12 2z" fill="url(#dm-grad)" />
                  <path d="M13.5 7.5L9.5 13H12L10 17L14 11.5H11.5L13.5 7.5Z" fill="white" />
                </svg>
                <h3 className={styles.emptyTitle}>Tin nhắn của bạn</h3>
                <p className={styles.emptyDescription}>
                  Chọn một cuộc trò chuyện hoặc nhấn{" "}
                  <button className={styles.emptyComposeLink} onClick={() => setShowCompose(true)}>+</button>{" "}
                  để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
