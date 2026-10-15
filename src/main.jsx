import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes, ScrollToTop, ErrorBoundary } from "./components";
import "./styles/index.scss";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import MessageToast from "./components/MessageToast/MessageToast";

// A lazy page chunk failed to load (flaky network, or a new deploy replaced
// the old files): reload once instead of showing the error screen.
// The timestamp guard stops a reload loop when the network stays down.
const RELOAD_KEY = "chunk-reload-at";
window.addEventListener("vite:preloadError", (event) => {
  let lastReload = 0;
  try {
    lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - lastReload < 10000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable: still try one reload
  }
  event.preventDefault();
  window.location.reload();
});

const AppWithSocket = () => (
  <SocketProvider>
    <AppRoutes />
    <MessageToast />
  </SocketProvider>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop>
          <AuthProvider>
            <AppWithSocket />
          </AuthProvider>
        </ScrollToTop>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
