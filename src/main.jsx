import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes, ScrollToTop, ErrorBoundary } from "./components";
import "./styles/index.scss";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import MessageToast from "./components/MessageToast/MessageToast";

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
