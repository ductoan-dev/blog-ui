import { useNavigate } from "react-router-dom";
import FallbackImage from "../FallbackImage/FallbackImage";
import { useSocket } from "../../context/SocketContext";
import isHttps from "../../utils/isHttps";
import styles from "./MessageToast.module.scss";

const resolveAvatar = (src) =>
  src ? (isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`) : null;

const getDisplayName = (sender) =>
  sender?.fullname ||
  [sender?.first_name, sender?.last_name].filter(Boolean).join(" ") ||
  sender?.username ||
  "Unknown";

const MessageToast = () => {
  const { toasts, dismissToast } = useSocket();
  const navigate = useNavigate();

  if (!toasts.length) return null;

  const handleClick = (toast) => {
    dismissToast(toast.id);
    navigate(`/messages?conversation=${toast.conversationId}`);
  };

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={styles.toast}
          onClick={() => handleClick(toast)}
        >
          <FallbackImage
            src={resolveAvatar(toast.sender?.avatar)}
            alt={getDisplayName(toast.sender)}
            className={styles.avatar}
          />
          <div className={styles.body}>
            <span className={styles.name}>{getDisplayName(toast.sender)}</span>
            <span className={styles.preview}>{toast.message.content}</span>
          </div>
          <button
            className={styles.close}
            onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageToast;
