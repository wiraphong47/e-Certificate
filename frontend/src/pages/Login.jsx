import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Link,
  Typography,
} from "@mui/material";
import Logo from "../assets/LogoDEPA-01.png";
import DepaMark from "../components/DepaMark";
import ThemeToggle from "../components/ThemeToggle";

// ข้อความที่แสดงในหน้าเข้าสู่ระบบ แยกตามภาษาที่เลือก
const copy = {
  TH: {
    title: "เข้าสู่ระบบ",
    subtitle: "ระบบออกใบประกาศนียบัตร e-Certificate",
    login: "เข้าสู่ระบบด้วย ThaID",
    scan: "สแกนหรือยืนยันตัวตนผ่านแอป ThaID",
    checks: "ระบบจะตรวจสอบสิทธิ์ของคุณโดยอัตโนมัติ",
    access: "ผู้เรียนเข้าสู่หน้าใบประกาศ · ทีมงานเข้าสู่หน้าผู้ดูแลระบบ",
    help: "เข้าสู่ระบบไม่ได้?",
    contact: "ติดต่อทีมงาน",
    footer: "ระบบออกใบประกาศนียบัตร e-Certificate",
    accessibility: "คำแนะนำการใช้งานด้วย Screen Reader และคีย์บอร์ด",
  },
  EN: {
    title: "Sign in",
    subtitle: "Depa e-Certificate issuance system",
    login: "Sign in with ThaID",
    scan: "Scan or verify your identity with the ThaID app",
    checks: "Your eligibility will be checked automatically.",
    access: "Learners access certificates · Staff access the admin system",
    help: "Having trouble signing in?",
    contact: "Contact support",
    footer: "Depa e-Certificate issuance system",
    accessibility: "Screen reader and keyboard accessibility guide",
  },
};

// หน้าเข้าสู่ระบบของผู้เรียนและผู้ดูแลระบบ
function Login() {
  // เก็บสถานะโหมด mock, ข้อผิดพลาด, ภาษาที่เลือก และขนาดตัวอักษร
  const [mockEnabled, setMockEnabled] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [language, setLanguage] = useState("TH");
  const t = copy[language];
  const requestedCourseCode = new URLSearchParams(window.location.search).get(
    "code",
  );

  // ถ้าผู้เรียนเปิดลิงก์ QR แล้วต้องล็อกอิน ให้ส่งรหัสคอร์สไปพร้อมคำขอ ThaID
  function startThaiIdLogin() {
    const query = requestedCourseCode
      ? `?code=${encodeURIComponent(requestedCourseCode)}`
      : "";
    window.location.assign(`/api/auth/thaid${query}`);
  }

  // ตรวจสอบจาก backend ว่าควรแสดงปุ่มเข้าสู่ระบบทดลองหรือไม่
  useEffect(() => {
    fetch("/api/auth/mode")
      .then((response) => response.json())
      .then((data) => setMockEnabled(data.mockEnabled))
      .catch(() => setMockEnabled(false));
  }, []);

  // เริ่มเข้าสู่ระบบด้วยบัญชีจำลองสำหรับทดสอบหน้าผู้เรียน/ผู้ดูแล
  async function startMockLogin(endpoint, destination, errorMessage) {
    setLoginError("");
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) throw new Error(errorMessage);
      window.location.assign(destination);
    } catch (error) {
      setLoginError(error.message);
    }
  }

  return (
    <Box
      className="login-shell"
      sx={{
        minHeight: "100vh",
        bgcolor: "#071B30",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        className="login-header"
        component="header"
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          px: { xs: 2, md: 5 },
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,.16)",
        }}
      >
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <ThemeToggle compact />
          <Box
            sx={{ display: "flex", gap: 0.75 }}
            aria-label="การตั้งค่าการแสดงผล"
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setLanguage((value) => (value === "TH" ? "EN" : "TH"))
              }
              sx={{ ...accessButtonSx, minWidth: 76, ml: 0.25 }}
              aria-label="เปลี่ยนภาษา"
            >
              {language === "TH" ? "TH | EN" : "EN | TH"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Container
        className="login-main"
        component="main"
        maxWidth={false}
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          p: "0 !important",
          width: "100%",
          maxWidth: "none !important",
        }}
      >
        <Box
          className="login-hero"
          sx={{
            bgcolor: "#0C2F53",
            color: "#fff",
            minHeight: { md: "calc(100vh - 112px)" },
            px: { xs: 2.5, md: 8, lg: 12 },
            py: { xs: 2.5, md: 8 },
            display: { xs: "grid", md: "flex" },
            gridTemplateColumns: {
              xs: "minmax(0, 1fr) minmax(100px, .72fr)",
              md: "none",
            },
            columnGap: { xs: 1.5, md: 0 },
            alignItems: { xs: "center", md: "stretch" },
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "#fff",
              letterSpacing: 2,
              fontWeight: 700,
              gridColumn: { xs: "1 / -1", md: "auto" },
              gridRow: { xs: 1, md: "auto" },
            }}
          >
            DEPA · e-CERTIFICATE
          </Typography>
          <Typography
            component="h1"
            variant="h3"
            fontWeight={800}
            sx={{
              mt: { xs: 0.5, md: 1 },
              maxWidth: 560,
              fontSize: { xs: "clamp(1.45rem, 6.5vw, 2rem)", md: "3rem" },
              lineHeight: 1.25,
              gridColumn: { xs: 1, md: "auto" },
              gridRow: { xs: 2, md: "auto" },
            }}
          >
            ยินดีต้อนรับสู่ระบบใบประกาศนียบัตรดิจิทัล
          </Typography>
          <Typography
            sx={{
              mt: { xs: 1, md: 2 },
              color: "#D7E3EF",
              maxWidth: 430,
              lineHeight: 1.8,
              fontSize: { xs: "0.82rem", md: "1rem" },
              gridColumn: { xs: 1, md: "auto" },
              gridRow: { xs: 3, md: "auto" },
            }}
          >
            เข้าสู่ระบบเพื่อยืนยันตัวตนและรับใบประกาศนียบัตรของคุณได้อย่างสะดวก
          </Typography>
          <Box
            sx={{
              mt: { xs: 0, md: 5 },
              width: { xs: 92, md: 210 },
              maxWidth: "100%",
              alignSelf: "center",
              opacity: 0.98,
              gridColumn: { xs: 2, md: "auto" },
              gridRow: { xs: "2 / span 2", md: "auto" },
            }}
          >
            <DepaMark
              size={210}
              style={{ width: "100%", maxWidth: "100%", height: "auto" }}
            />
          </Box>
        </Box>

        <Box
          className="login-content"
          sx={{
            px: { xs: 2.5, sm: 6, lg: 10 },
            py: { xs: 3.5, md: 8 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "#08111C",
            color: "#fff",
          }}
        >
          <Box sx={{ maxWidth: 440, width: "100%", mx: "auto" }}>
            <Box
              sx={{
                width: 156,
                height: 74,
                overflow: "hidden",
                bgcolor: "#fff",
                mb: { xs: 2, md: 4 },
              }}
            >
              <Box
                component="img"
                src={Logo}
                alt="depa"
                sx={{
                  display: "block",
                  width: 156,
                  height: 156,
                  position: "relative",
                  top: -42,
                }}
              />
            </Box>
            <Typography
              component="h2"
              variant="h4"
              fontWeight={800}
              sx={{
                color: "#fff",
                mb: 1,
                fontSize: { xs: "1.65rem", md: "2.125rem" },
              }}
            >
              {t.title}
            </Typography>
            <Box sx={{ width: 58, height: 4, bgcolor: "#FFC600", mb: 2 }} />
            <Typography sx={{ color: "#B8C7D6", mb: 3.5 }}>
              {t.subtitle}
            </Typography>

            <Button
              fullWidth
              variant="contained"
              startIcon={
                <Box
                  component="img"
                  src="/images/Thaid Logo.webp"
                  alt="ThaID"
                  sx={{ width: 20, height: 20 }}
                />
              }
              onClick={startThaiIdLogin}
              sx={{
                minHeight: 54,
                bgcolor: "#FFF200",
                color: "#0C2F53",
                borderRadius: 1,
                fontWeight: 800,
                "&:hover": { bgcolor: "#FFC600" },
              }}
            >
              {t.login}
            </Button>
            <Typography variant="body2" sx={{ color: "#B8C7D6", mt: 1.25 }}>
              {t.scan}
            </Typography>

            {loginError && (
              <Alert severity="error" sx={{ mt: 2, textAlign: "left" }}>
                {loginError}
              </Alert>
            )}

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,.18)" }} />
            <Typography
              variant="body2"
              sx={{ color: "#B8C7D6", lineHeight: 1.9 }}
            >
              {t.checks}
              <br />
              {t.access}
            </Typography>
            <Typography variant="body2" sx={{ color: "#B8C7D6", mt: 2 }}>
              {t.help}{" "}
              <Link
                href="#support"
                underline="always"
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  "&:hover": { color: "#FFC600" },
                }}
              >
                {t.contact}
              </Link>
            </Typography>

            {mockEnabled && (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  onClick={() =>
                    startMockLogin(
                      "/api/auth/mock",
                      requestedCourseCode
                        ? `/course-code?code=${encodeURIComponent(requestedCourseCode)}`
                        : "/course-code",
                      "เริ่มโหมดทดลองไม่ได้ ตรวจการตั้งค่า backend และ .env",
                    )
                  }
                  sx={{ color: "#B8C7D6", textTransform: "none" }}
                >
                  ทดลองในฐานะผู้เรียน
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    startMockLogin(
                      "/api/auth/mock-admin",
                      "/admin/courses",
                      "เริ่มโหมดผู้จัดคอร์สไม่ได้ ตรวจการตั้งค่า backend และ .env",
                    )
                  }
                  sx={{ color: "#B8C7D6", textTransform: "none" }}
                >
                  ผู้จัดคอร์ส
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* footer แสดงชื่อระบบและลิงก์การช่วยการเข้าถึง */}
      <Box
        className="login-footer"
        component="footer"
        sx={{
          minHeight: 52,
          borderTop: "1px solid rgba(255,255,255,.16)",
          px: { xs: 2, sm: 5 },
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="caption" sx={{ color: "#B8C7D6" }}>
          © depa · {t.footer}
        </Typography>
        <Link
          href="#accessibility"
          underline="always"
          sx={{
            color: "#fff",
            fontSize: "0.75rem",
            "&:hover": { color: "#FFC600" },
          }}
        >
          {t.accessibility}
        </Link>
      </Box>
    </Box>
  );
}

const accessButtonSx = {
  minWidth: 38,
  height: 37,
  borderColor: "rgba(255,255,255,.55)",
  color: "#fff",
  borderRadius: 1,
  fontWeight: 700,
  "&:hover": { borderColor: "#FFC600", bgcolor: "rgba(255,255,255,.08)" },
};

export default Login;
