import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "./AuthLayout.module.scss";

const AuthLayout = ({ children }) => {
    return (
        <div className={styles.layout}>
            <div className={styles.container}>
                {/* Auth Content */}
                <div className={styles.content}>{children || <Outlet />}</div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p className="text-muted text-center">
                        &copy; 2026 BlogUI. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

AuthLayout.propTypes = {
    children: PropTypes.node,
};

export default AuthLayout;
