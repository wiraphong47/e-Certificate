import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import AdminSidebar from "../components/AdminSidebar";

// ค่าเริ่มต้นของข้อมูลคอร์ส; ใช้คืนฟอร์มหลังบันทึกหรือกดยกเลิก
const blankCourse = {
  title: "",
  instructor: "",
  startDate: "",
  endDate: "",
  code: "",
};
// รูปแบบพื้นฐานของแผงข้อมูลในการจัดการคอร์ส
const panelSx = {
  bgcolor: "#0C2F53",
  color: "#fff",
  border: "none",
  borderTop: "3px solid rgba(255,255,255,.45)",
  borderBottom: "1px solid rgba(255,255,255,.18)",
  borderRadius: 0,
  boxShadow: "none",
};
// Form fields use a white surface and a strong depa-blue outline.
const fieldSx = {
  "& .MuiInputLabel-root": { color: "#B8C7D6" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#FFF200" },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    bgcolor: "#07111D",
    borderRadius: 1,
    transition: "background-color 160ms ease, box-shadow 160ms ease",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#7995AE",
      borderWidth: 2,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#B8C7D6" },
    "&.Mui-focused": {
      bgcolor: "#07111D",
      boxShadow: "0 0 0 2px rgba(255, 242, 0, 0.12)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#FFF200",
      borderWidth: 3,
    },
    "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#f27777" },
    "&.Mui-disabled": { bgcolor: "#163E64" },
  },
  "& .MuiInputBase-input::placeholder": { color: "#8FAAC2", opacity: 1 },
  // Browser autofill can force a pale background; keep it aligned with the dark form.
  "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
    {
      WebkitBoxShadow: "0 0 0 100px #07111D inset",
      WebkitTextFillColor: "#fff",
      caretColor: "#fff",
      borderRadius: "inherit",
    },
  "& input[type='date']": { colorScheme: "light" },
  "& input[type='date']::-webkit-calendar-picker-indicator": {
    filter: "invert(15%) sepia(35%) saturate(1500%) hue-rotate(173deg)",
    opacity: 1,
    cursor: "pointer",
  },
  "& .MuiSvgIcon-root": { color: "#d6e0e9" },
};

// แปลงไฟล์รูปที่ผู้ดูแลเลือกเป็น Data URL เพื่อส่งให้ backend บันทึก
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

// สร้าง URL ประจำคอร์สให้ QR; เมื่อเปิดแล้วหน้าเรียนจะรับรหัสไปตรวจสอบต่อ
function buildCourseQrUrl(code) {
  const courseUrl = new URL("/course-code", window.location.origin);
  courseUrl.searchParams.set("code", code);
  return courseUrl.toString();
}

// ดาวน์โหลด QR เป็น SVG เพื่อให้ผู้จัดนำไปพิมพ์หรือส่งให้ผู้เรียน
function downloadCourseQrSvg(course) {
  const qrElement = document.getElementById(`course-qr-${course.id}`);
  if (!qrElement) return;

  const svg = qrElement.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const file = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const fileUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = `${course.code}-QR.svg`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

// หน้าสร้างคอร์ส อัปโหลดพื้นหลังใบประกาศ และแสดงรายการคอร์สเดิม
export default function CourseManagement({ user, onLogout }) {
  // state ของรายการคอร์ส ฟอร์ม รูปแบบใบประกาศ และสถานะตอบกลับ
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(blankCourse);
  const [templateDataUrl, setTemplateDataUrl] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateAspectRatio, setTemplateAspectRatio] = useState(297 / 210);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  // ดึงรายการคอร์สของผู้ดูแลจาก backend
  async function loadCourses() {
    const response = await fetch("/api/admin/courses");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "โหลดรายการคอร์สไม่สำเร็จ");
    setCourses(data.courses);
  }

  // โหลดคอร์สหนึ่งครั้งเมื่อเปิดหน้านี้
  useEffect(() => {
    loadCourses().catch((loadError) => setError(loadError.message));
  }, []);

  // ตรวจชนิด/ขนาดไฟล์ก่อนอ่านภาพ และเตรียมภาพตัวอย่างในหน้า
  async function handleTemplateChange(event) {
    const file = event.target.files?.[0];
    setError("");
    setTemplateDataUrl("");
    setTemplateName("");
    setTemplateAspectRatio(297 / 210);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("เลือกรูปแบบ PNG, JPG หรือ WebP");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("ไฟล์รูปต้องมีขนาดไม่เกิน 8 MB");
      return;
    }
    try {
      const imageDataUrl = await readImage(file);
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth && image.naturalHeight) {
          setTemplateAspectRatio(image.naturalWidth / image.naturalHeight);
        }
      };
      image.src = imageDataUrl;
      setTemplateDataUrl(imageDataUrl);
      setTemplateName(file.name);
    } catch (readError) {
      setError(readError.message);
    }
  }

  // ตรวจฟอร์มและส่งข้อมูลคอร์สพร้อมรูปใบประกาศไปบันทึก
  async function createCourse(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...course, templateDataUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกคอร์สไม่สำเร็จ");
      setCourses((existing) => [...existing, data.course]);
      setCourse(blankCourse);
      setTemplateDataUrl("");
      setTemplateName("");
      setTemplateAspectRatio(297 / 210);
      setMessage("เพิ่มคอร์สและแบบใบประกาศแล้ว");
      event.target.reset();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  // คืน event handler สำหรับอัปเดตช่องข้อมูลแต่ละช่องใน state
  function updateField(field) {
    return (event) =>
      setCourse((current) => ({ ...current, [field]: event.target.value }));
  }

  // ล้างค่าในฟอร์มและข้อความแจ้งผล
  function resetForm() {
    setCourse(blankCourse);
    setTemplateDataUrl("");
    setTemplateName("");
    setTemplateAspectRatio(297 / 210);
    setError("");
    setMessage("");
    document.getElementById("course-management-form")?.reset();
  }

  // สร้างรหัสคอร์สสุ่มให้ผู้ดูแลนำไปใช้หรือแก้ไขต่อ
  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const suffix = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    setCourse((current) => ({ ...current, code: `DEPA-${suffix}` }));
  }

  return (
    <Box
      className="course-management-shell"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        bgcolor: "#071B30",
        color: "#fff",
      }}
    >
      <AdminSidebar
        activeItem="คอร์ส"
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
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{ mb: 2.5, fontSize: { xs: "1.55rem", sm: "2rem" } }}
          >
            จัดการคอร์สและใบประกาศ
          </Typography>
          <Box sx={{ width: 56, height: 4, bgcolor: "#FFC600", mb: 3 }} />

          {/* แบบฟอร์มข้อมูลคอร์สและแบบใบประกาศ แบ่งเป็นสองแผง */}
          <Box
            component="form"
            id="course-management-form"
            onSubmit={createCourse}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {/* ข้อมูลหลักสูตร ผู้สอน วันจัด และรหัสที่ผู้เรียนจะใช้ */}
            <Card sx={panelSx}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography
                  variant="h6"
                  component="h2"
                  fontWeight={800}
                  sx={{ mb: 1.75, fontSize: 16 }}
                >
                  ข้อมูลคอร์ส
                </Typography>
                <Stack spacing={1.6}>
                  <TextField
                    label="ชื่อหลักสูตร"
                    placeholder="[ชื่อหลักสูตร]"
                    value={course.title}
                    onChange={updateField("title")}
                    required
                    fullWidth
                    sx={fieldSx}
                  />
                  <TextField
                    label="ผู้สอน"
                    placeholder="[ชื่อผู้สอน]"
                    value={course.instructor}
                    onChange={updateField("instructor")}
                    required
                    fullWidth
                    sx={fieldSx}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField
                      label="วันที่เริ่มคอร์ส"
                      type="date"
                      value={course.startDate}
                      onChange={updateField("startDate")}
                      required
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={fieldSx}
                    />
                    <TextField
                      label="วันที่จบคอร์ส"
                      type="date"
                      value={course.endDate}
                      onChange={updateField("endDate")}
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={fieldSx}
                    />
                  </Stack>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ mb: 0.75 }}
                    >
                      รหัสที่ผู้เรียนใช้กรอก
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        placeholder="[รหัส]"
                        value={course.code}
                        onChange={updateField("code")}
                        required
                        fullWidth
                        sx={fieldSx}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={generateCode}
                        sx={{
                          color: "#fff",
                          borderColor: "#8FAAC2",
                          fontWeight: 700,
                          minWidth: 74,
                          borderRadius: 1,
                          "&:hover": {
                            borderColor: "#B8C7D6",
                            bgcolor: "rgba(255,255,255,.08)",
                          },
                        }}
                      >
                        สุ่มรหัส
                      </Button>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.75, color: "#B8C7D6" }}
                    >
                      ผู้สอนส่งรหัสนี้ให้ผู้เรียน
                      ตั้งวันหมดอายุของรหัสได้ที่หน้า “รหัสประจำคอร์ส”
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* อัปโหลดภาพพื้นหลังและดูตัวอย่างก่อนบันทึก */}
            <Card sx={panelSx}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography
                  variant="h6"
                  component="h2"
                  fontWeight={800}
                  sx={{ mb: 1.75, fontSize: 16 }}
                >
                  ใบประกาศนียบัตร
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                  แบบรูปภาพใบประกาศ
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    minHeight: 42,
                    color: "#fff",
                    borderColor: "#8FAAC2",
                    bgcolor: "#07111D",
                    borderWidth: 2,
                    borderRadius: 1,
                    textTransform: "none",
                    "&:hover": { borderColor: "#FFC600", bgcolor: "#0C2F53" },
                  }}
                >
                  <Box
                    component="span"
                    className="upload-file-chip"
                    sx={{
                      px: 1,
                      py: 0.3,
                      mr: 1,
                      bgcolor: "rgba(255,255,255,.12)",
                      color: "#fff",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  >
                    Choose File
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {templateName || "No file chosen"}
                  </Box>
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleTemplateChange}
                    required
                  />
                </Button>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "#B8C7D6",
                    mt: 0.75,
                    lineHeight: 1.7,
                  }}
                >
                  ไฟล์ PNG หรือ JPG ขนาดไม่เกิน 8 MB แนะนำสัดส่วน A4 แนวนอน
                  ระบบจะวางชื่อผู้เรียนและเลขอ้างอิงลงบนภาพนี้
                </Typography>
                <Box
                  className="template-preview"
                  sx={{
                    mt: 1.5,
                    width: "100%",
                    aspectRatio: templateAspectRatio,
                    border: "2px dashed #7995AE",
                    borderRadius: 0,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    bgcolor: "#07111D",
                  }}
                >
                  {templateDataUrl ? (
                    <Box
                      component="img"
                      src={templateDataUrl}
                      alt="ตัวอย่างรูปแบบใบประกาศ"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                      ตัวอย่างรูปภาพใบประกาศจะแสดงที่นี่
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Box
              sx={{
                gridColumn: { xs: "1", lg: "1 / -1" },
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                pt: 0.25,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  bgcolor: "#FFF200",
                  color: "#0C2F53",
                  fontWeight: 800,
                  minWidth: 112,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "#FFC600" },
                }}
              >
                {saving ? "กำลังบันทึก…" : "บันทึกคอร์ส"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={resetForm}
                sx={{
                  color: "#fff",
                  borderColor: "#B8C7D6",
                  fontWeight: 700,
                  minWidth: 84,
                  borderRadius: 1,
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,.08)",
                  },
                }}
              >
                ยกเลิก
              </Button>
              {error && (
                <Alert severity="error" sx={{ flexBasis: "100%" }}>
                  {error}
                </Alert>
              )}
              {message && (
                <Alert severity="success" sx={{ flexBasis: "100%" }}>
                  {message}
                </Alert>
              )}
            </Box>
          </Box>

          {/* รายการคอร์สที่ backend บันทึกไว้แล้ว */}
          <Box sx={{ mt: 4 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6" component="h2" fontWeight={800}>
                รายการคอร์ส
              </Typography>
              <Chip
                label={courses.length}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.3)",
                  borderRadius: 0.5,
                }}
              />
            </Stack>
            {courses.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#B8C7D6" }}>
                ยังไม่มีคอร์สที่บันทึกไว้
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    xl: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {courses.map((item) => (
                  <Card key={item.id} sx={panelSx}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            {item.templateUrl && (
                              <Box
                                component="img"
                                src={item.templateUrl}
                                alt="พื้นหลังใบประกาศ"
                                sx={{
                                  width: 92,
                                  height: 62,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  border: "1px solid #7995AE",
                                }}
                              />
                            )}
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800}>
                                {item.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#B8C7D6" }}
                              >
                                {item.instructor} · {item.startDate}
                                {item.endDate ? ` ถึง ${item.endDate}` : ""}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#B8C7D6" }}
                              >
                                รหัส {item.code} ·{" "}
                                {item.templateUrl
                                  ? "มีแบบใบประกาศ"
                                  : "ยังไม่มีแบบใบประกาศ"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                        <Stack
                          alignItems="center"
                          spacing={0.5}
                          sx={{
                            flexShrink: 0,
                            alignSelf: { xs: "center", sm: "auto" },
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              bgcolor: "#fff",
                              border: "1px solid #B8C7D6",
                              lineHeight: 0,
                            }}
                          >
                            <QRCodeSVG
                              id={`course-qr-${item.id}`}
                              value={buildCourseQrUrl(item.code)}
                              size={88}
                              level="M"
                              marginSize={2}
                              title={`QR สำหรับคอร์ส ${item.title}`}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "#B8C7D6", textAlign: "center" }}
                          >
                            สแกนเพื่อรับใบประกาศ
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => downloadCourseQrSvg(item)}
                            sx={{
                              color: "#fff",
                              textTransform: "none",
                              minWidth: 0,
                              py: 0,
                              "&:hover": { color: "#FFC600" },
                            }}
                          >
                            ดาวน์โหลด QR
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
