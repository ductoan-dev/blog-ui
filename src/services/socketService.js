import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

let socket = null;

export const connect = () => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("token");
  if (!token) return null;

  socket = io(BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  return socket;
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinConversation = (conversationId) => {
  socket?.emit("join_conversation", conversationId);
};

export const leaveConversation = (conversationId) => {
  socket?.emit("leave_conversation", conversationId);
};

export const sendMessageSocket = (conversationId, content) =>
  new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error("Socket not connected"));
    socket.emit("send_message", { conversationId, content }, (res) => {
      if (res?.ok) resolve(res.message);
      else reject(new Error(res?.error || "Send failed"));
    });
  });

export const emitTyping = (conversationId) => {
  socket?.emit("typing", { conversationId });
};

export const emitStopTyping = (conversationId) => {
  socket?.emit("stop_typing", { conversationId });
};

export default { connect, disconnect, getSocket, joinConversation, leaveConversation, sendMessageSocket, emitTyping, emitStopTyping };
