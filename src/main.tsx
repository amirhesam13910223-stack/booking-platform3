import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ذخیره referral code از URL برای استفاده بعدی
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get("ref");
if (refCode) {
  localStorage.setItem("pending_ref", refCode);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
