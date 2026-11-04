import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Secretcode from "./pages/Secretcode";
import CourseManagement from "./pages/CourseManagement";
import AdminDashboard from "./pages/AdminDashboard";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import useAuthSession from "./hooks/useAuthSession";
import { ThemeModeContext } from "./contexts/ThemeModeContext";

// ตรวจสอบ session ของผู้เรียนก่อนอนุญาตให้เปิดหน้ากรอกรหัสคอร์ส
function AuthenticatedCourseCode() {
  const location = useLocation();
  const { user, checking, logout } = useAuthSession();

  if (checking) return null;
  if (!user) {
    // ถ้าเข้ามาจาก QR ให้คงรหัสไว้ระหว่างพาผู้เรียนไปล็อกอิน
    const code = new URLSearchParams(location.search).get("code");
    const loginUrl = code ? `/?code=${encodeURIComponent(code)}` : "/";
    return <Navigate to={loginUrl} replace />;
  }

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <Secretcode />
    </>
  );
}

// หน้าจัดการคอร์สอนุญาตเฉพาะบัญชีที่มี role เป็น admin
function AuthenticatedCourseManagement() {
  const { user, checking, logout } = useAuthSession();

  if (checking) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/course-code" replace />;

  return <CourseManagement user={user} onLogout={logout} />;
}

// ตรวจสิทธิ์ผู้ดูแลระบบก่อนแสดง Dashboard
function AuthenticatedDashboard() {
  const { user, checking, logout } = useAuthSession();

  if (checking) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/course-code" replace />;

  return <AdminDashboard user={user} onLogout={logout} />;
}

// รวม route ของแอปและกำหนดธีม MUI ให้ใช้ได้ทุกหน้า
function App() {
  const [mode, setMode] = useState(
    () => window.localStorage.getItem("e-certificate-theme") || "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem("e-certificate-theme", mode);
  }, [mode]);

  function toggleTheme() {
    setMode((currentMode) => currentMode === "dark" ? "light" : "dark");
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/course-code" element={<AuthenticatedCourseCode />} />
            <Route
              path="/admin/courses"
              element={<AuthenticatedCourseManagement />}
            />
            <Route path="/admin/dashboard" element={<AuthenticatedDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default App;
