import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import AdminSidebar from "../components/AdminSidebar";

const statsConfig = [
  { key: "courses", label: "คอร์สทั้งหมด" },
  { key: "active", label: "คอร์สที่เปิดใช้งาน" },
  { key: "applicants", label: "ผู้สมัคร" },
  { key: "recipients", label: "ผู้รับใบประกาศ" },
];

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Dashboard summary and reports, populated from the admin courses endpoint.
export default function AdminDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    fetch("/api/admin/courses")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "โหลดข้อมูล Dashboard ไม่สำเร็จ");
        setCourses(data.courses || []);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const stats = useMemo(() => {
    const today = todayLocal();
    const active = courses.filter(
      (course) =>
        course.startDate <= today &&
        (!course.endDate || course.endDate >= today),
    ).length;
    return {
      courses: courses.length,
      active,
      applicants: "—",
      recipients: "—",
    };
  }, [courses]);

  return (
    <Box
      className="dashboard-shell"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        bgcolor: "#071B30",
        color: "#fff",
      }}
    >
      <AdminSidebar
        activeItem="Dashboard"
        user={user}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
        onCloseMobileMenu={closeMobileMenu}
      />
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, ml: { xs: 0, sm: "200px" }, p: { xs: 2, sm: 3, md: 4 } }}
      >
        <Box sx={{ maxWidth: 1120, mx: "auto" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography
                component="h1"
                variant="h4"
                fontWeight={800}
                sx={{ color: "#fff", fontSize: { xs: "1.6rem", sm: "2rem" } }}
              >
                Dashboard
              </Typography>
              <Box sx={{ width: 56, height: 4, bgcolor: "#FFC600", mt: 1 }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "#B8C7D6", textAlign: "right" }}
            >
              {user?.name || "ผู้ดูแลระบบ"} · ผู้ดูแลระบบ
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Summary metrics sit on one baseline without individual cards. */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                lg: "repeat(4,minmax(0,1fr))",
              },
              mb: 4,
            }}
          >
            {statsConfig.map(({ key, label }, index) => (
              <Box
                className="dashboard-stat"
                key={key}
                sx={{
                  py: 1.5,
                  px: { xs: 1, sm: 2 },
                  borderBottom: "1px solid rgba(255,255,255,.2)",
                  borderRight: {
                    xs:
                      index % 2 === 0
                        ? "1px solid rgba(255,255,255,.2)"
                        : "none",
                    lg: index < 3 ? "1px solid rgba(255,255,255,.2)" : "none",
                  },
                }}
              >
                <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                  {label}
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 3,
                    bgcolor: "#FFC600",
                    mt: 1.25,
                    mb: 0.5,
                  }}
                />
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ color: "#fff" }}
                >
                  {stats[key]}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Report tables are grouped by rules and spacing instead of cards. */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: { xs: 4, lg: 5 },
            }}
          >
            <Box
              className="dashboard-report-divider"
              component="section"
              aria-labelledby="province-report"
              sx={{
                pb: { xs: 3, lg: 0 },
                pr: { lg: 3 },
                borderBottom: {
                  xs: "1px solid rgba(255,255,255,.2)",
                  lg: "none",
                },
                borderRight: {
                  xs: "none",
                  lg: "1px solid rgba(255,255,255,.2)",
                },
              }}
            >
              <Typography
                id="province-report"
                component="h2"
                variant="h6"
                fontWeight={800}
                sx={{ color: "#fff" }}
              >
                ผู้สมัครแยกตามจังหวัด
              </Typography>
              <Box
                sx={{ width: 36, height: 3, bgcolor: "#FFC600", mt: 1, mb: 2 }}
              />
              <Box
                className="dashboard-table-head"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 72px minmax(80px,110px)",
                  gap: 1,
                  pb: 1,
                  borderBottom: "2px solid rgba(255,255,255,.5)",
                }}
              >
                <Typography variant="caption" fontWeight={700}>
                  จังหวัด
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  จำนวน
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  สัดส่วน
                </Typography>
              </Box>
              <Box
                className="dashboard-report-row"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 72px minmax(80px,110px)",
                  gap: 1,
                  alignItems: "center",
                  py: 1.2,
                  borderBottom: "1px solid rgba(255,255,255,.14)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                  ยังไม่มีข้อมูล
                </Typography>
                <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                  —
                </Typography>
                <Box sx={{ height: 7, bgcolor: "rgba(255,255,255,.14)" }} />
              </Box>
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1.5, color: "#B8C7D6" }}
              >
                ข้อมูลแยกตามจังหวัดจะแสดงเมื่อระบบมีข้อมูลผู้สมัคร
              </Typography>
            </Box>

            <Box
              component="section"
              aria-labelledby="course-report"
              sx={{ pt: { xs: 1, lg: 0 }, pl: { lg: 3 } }}
            >
              <Typography
                id="course-report"
                component="h2"
                variant="h6"
                fontWeight={800}
                sx={{ color: "#fff" }}
              >
                ผู้เรียนแยกตามคอร์ส
              </Typography>
              <Box
                sx={{ width: 36, height: 3, bgcolor: "#FFC600", mt: 1, mb: 2 }}
              />
              <Box
                className="dashboard-table-head"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 64px minmax(80px,110px)",
                  gap: 1,
                  pb: 1,
                  borderBottom: "2px solid rgba(255,255,255,.5)",
                }}
              >
                <Typography variant="caption" fontWeight={700}>
                  คอร์ส
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  จำนวน
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  ผู้เรียน
                </Typography>
              </Box>
              {courses.length ? (
                courses.slice(0, 5).map((course) => (
                  <Box
                    className="dashboard-report-row"
                    key={course.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0,1fr) 64px minmax(80px,110px)",
                      gap: 1,
                      alignItems: "center",
                      py: 1.2,
                      borderBottom: "1px solid rgba(255,255,255,.14)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={course.title}
                    >
                      {course.title}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      —
                    </Typography>
                    <Box
                      className="dashboard-bar-track"
                      sx={{
                        height: 7,
                        bgcolor: "rgba(255,255,255,.14)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{ width: 0, height: "100%", bgcolor: "#0C2F53" }}
                      />
                    </Box>
                  </Box>
                ))
              ) : (
                <Box
                  sx={{ py: 3, borderBottom: "1px solid rgba(255,255,255,.2)" }}
                >
                  <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                    ยังไม่มีข้อมูลคอร์ส
                  </Typography>
                </Box>
              )}
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1.5, color: "#B8C7D6" }}
              >
                สถิติผู้เรียนจะแสดงเมื่อระบบเริ่มบันทึกการรับใบประกาศ
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
