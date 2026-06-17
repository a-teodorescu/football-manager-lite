import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        window.dispatchEvent(
          new CustomEvent("fml-sw-registered", {
            detail: { scope: registration.scope },
          }),
        );
      })
      .catch((error: unknown) => {
        window.dispatchEvent(
          new CustomEvent("fml-sw-error", {
            detail: error instanceof Error ? error.message : String(error),
          }),
        );
      });
  });
}
