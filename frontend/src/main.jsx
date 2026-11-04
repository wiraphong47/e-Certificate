import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// จุดเริ่มต้นของ React: สร้างแอปแล้วผูกเข้ากับ element id="root" ใน index.html
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
