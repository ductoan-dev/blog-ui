import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import * as socketService from "../services/socketService";
import notificationService from "../services/notificationService";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  // { [convId]: count }
  const [unreadByConv, setUnreadByConv] = useState({});
  // toast queue
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});
  // follow notifications
  const [notifications, setNotifications] = useState([]);

  const totalUnread = Object.values(unreadByConv).reduce((s, n) => s + n, 0);

  // ── Connect / disconnect with auth ───────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = socketService.connect();
    if (!s) return;
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [isAuthenticated]);

  // ── Request browser notification permission + fetch initial notifications ──
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    notificationService.getAll().then((res) => {
      if (res?.data?.data) setNotifications(res.data.data);
    }).catch(() => {});
  }, [isAuthenticated]);

  // ── Listen for incoming message notifications ────────────────
  useEffect(() => {
    if (!socket) return;

    const onNotification = ({ conversationId, message, sender }) => {
      const isOnMessagesPage = location.pathname === "/messages";

      // Increment unread count for this conversation
      setUnreadByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1,
      }));

      // Browser notification when tab is not focused
      if (document.hidden || !isOnMessagesPage) {
        const name =
          sender.fullname ||
          [sender.first_name, sender.last_name].filter(Boolean).join(" ") ||
          sender.username;

        if (Notification.permission === "granted") {
          const n = new Notification(`Tin nhắn từ ${name}`, {
            body: message.content,
            icon: sender.avatar || "/favicon.ico",
            tag: conversationId,
          });
          n.onclick = () => {
            window.focus();
            window.location.href = `/messages?conversation=${conversationId}`;
            n.close();
          };
        }

        // In-app toast
        const toastId = `${conversationId}-${message.id || Date.now()}`;
        setToasts((prev) => [
          ...prev.filter((t) => t.id !== toastId),
          { id: toastId, conversationId, message, sender },
        ]);

        // Auto-dismiss after 5s
        clearTimeout(toastTimers.current[toastId]);
        toastTimers.current[toastId] = setTimeout(() => {
          dismissToast(toastId);
        }, 5000);
      }
    };

    socket.on("notification:new_message", onNotification);
    return () => socket.off("notification:new_message", onNotification);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, location.pathname]);

  // ── Listen for all in-app notifications (follow, like, comment) ──
  useEffect(() => {
    if (!socket) return;
    const onNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("notification:new", onNotif);
    return () => socket.off("notification:new", onNotif);
  }, [socket]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    clearTimeout(toastTimers.current[toastId]);
    delete toastTimers.current[toastId];
  }, []);

  const markConvRead = useCallback((convId) => {
    setUnreadByConv((prev) => {
      if (!prev[convId]) return prev;
      const next = { ...prev };
      delete next[convId];
      return next;
    });
  }, []);

  const markNotifRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markRead(id);
    } catch {}
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllRead();
    } catch {}
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket, connected,
        unreadByConv, totalUnread, markConvRead,
        toasts, dismissToast,
        notifications, markNotifRead, markAllNotifsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
