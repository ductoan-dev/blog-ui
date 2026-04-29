import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Button from "../Button/Button";
import FallbackImage from "../FallbackImage/FallbackImage";
import isHttps from "../../utils/isHttps";
import styles from "./UserCard.module.scss";

const resolveImage = (src) => {
  if (!src) return src;
  return isHttps(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
};

const deriveName = (user) =>
  user?.fullname ||
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.username;

const UserCard = ({ user, className, ...props }) => {
  if (!user) {
    return (
      <div
        className={`${styles.userCardGuest} ${className || ""}`}
        {...props}
      >
        <p className={styles.guestText}>Sign in to see your profile.</p>
        <Button variant="primary" size="sm" fullWidth asChild>
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const name = deriveName(user);
  const to = user.username ? `/profile/${user.username}` : "#";

  return (
    <Link to={to} className={`${styles.userCard} ${className || ""}`} {...props}>
      <FallbackImage
        src={resolveImage(user.avatar)}
        alt={name || "User"}
        className={styles.avatar}
      />
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        {user.username && (
          <span className={styles.handle}>@{user.username}</span>
        )}
      </div>
    </Link>
  );
};

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
    fullname: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    avatar: PropTypes.string,
  }),
  className: PropTypes.string,
};

export default UserCard;
