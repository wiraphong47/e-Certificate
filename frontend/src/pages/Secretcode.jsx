import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import CertificatePreview from "../components/CertificatePreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import DepaMark from "../components/DepaMark";

const steps = ["ยืนยันตัวตนด้วย ThaID", "กรอกรหัสคอร์ส"];

// หน้าผู้เรียนกรอกรหัสคอร์ส ตรวจสิทธิ์ และสร้างใบประกาศ PDF
function Secretcode() {
  // state เก็บข้อมูลฟอร์ม ผลการตรวจรหัส และสถานะดาวน์โหลดของหน้านี้
  const [code, setCode] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [mockEnabled, setMockEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [openedFromQr, setOpenedFromQr] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");

  // element ref ให้หน้าใช้จับภาพตัวอย่างใบประกาศสำหรับทำ PDF
  const certificateRef = useRef(null);
  const videoRef = useRef(null);
  const autoDownloadStarted = useRef(false);
  const qrRedeemHandled = useRef(false);

  // อ่านว่า backend เปิดโหมด mock สำหรับทดสอบหรือไม่
  useEffect(() => {
    fetch("/api/auth/mode")
      .then((response) => response.json())
      .then((data) => setMockEnabled(data.mockEnabled))
      .catch(() => setMockEnabled(false));
  }, []);

  // แปลงใบประกาศที่แสดงอยู่เป็น PDF แล้วเริ่มดาวน์โหลด
  const downloadCertificatePdf = useCallback(async () => {
    if (!certificateRef.current || !certificate) return;

    setDownloading(true);
    setDownloadError("");
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.96),
        "JPEG",
        0,
        0,
        297,
        210,
      );
      pdf.save(`${certificate.reference || "certificate"}.pdf`);
    } catch {
      setDownloadError("สร้างไฟล์ PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDownloading(false);
    }
  }, [certificate]);

  // ดาวน์โหลดอัตโนมัติครั้งเดียวหลังตรวจรหัสและแสดงใบประกาศสำเร็จ
  useEffect(() => {
    if (!certificate || autoDownloadStarted.current) return;
    autoDownloadStarted.current = true;
    downloadCertificatePdf();
  }, [certificate, downloadCertificatePdf]);

  // รับรหัสจากช่องกรอกหรือ URL QR แล้วส่งไปตรวจสอบกับ backend
  const redeemCodeValue = useCallback(async (value) => {
    setError("");
    setCertificate(null);
    setDownloadError("");
    autoDownloadStarted.current = false;
    setSubmitting(true);

    try {
      const response = await fetch("/api/course-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ตรวจสอบรหัสไม่สำเร็จ");
      setCertificate(data.certificate);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // เปิดกล้องเพื่ออ่าน QR; stream จะถูกปิดทันทีเมื่อปิดหน้าสแกนหรืออ่านสำเร็จ
  useEffect(() => {
    if (!scannerOpen) return undefined;

    let cancelled = false;
    let stream;
    let animationFrame;
    let lastScanAt = 0;

    async function startScanner() {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        !("BarcodeDetector" in window)
      ) {
        setScannerError(
          "เบราว์เซอร์นี้ยังไม่รองรับการสแกน QR ผ่านกล้อง กรุณาใช้ Chrome บน Android หรือกรอกรหัสคอร์สแทน",
        );
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        async function scanFrame(now) {
          if (cancelled || !videoRef.current) return;
          if (
            now - lastScanAt > 250 &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            lastScanAt = now;
            try {
              const results = await detector.detect(video);
              const value = results[0]?.rawValue?.trim();
              if (value) {
                let courseCode = value;
                try {
                  const scannedUrl = new URL(value);
                  courseCode = scannedUrl.searchParams.get("code") || value;
                } catch {
                  // QR ที่เป็นรหัสอย่างเดียวใช้ข้อความนั้นเป็นรหัสคอร์สได้เลย
                }

                setCode(courseCode);
                setScannerOpen(false);
                redeemCodeValue(courseCode);
                return;
              }
            } catch {
              // ข้ามเฟรมที่กล้องยังอ่านไม่สำเร็จ แล้วลองเฟรมถัดไป
            }
          }
          animationFrame = requestAnimationFrame(scanFrame);
        }

        animationFrame = requestAnimationFrame(scanFrame);
      } catch {
        if (!cancelled) {
          setScannerError(
            "เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องและลองอีกครั้ง",
          );
        }
      }
    }

    setScannerError("");
    startScanner();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scannerOpen, redeemCodeValue]);

  // เมื่อเปิดลิงก์ QR ให้เติมรหัสจาก URL และดาวน์โหลดใบประกาศอัตโนมัติครั้งเดียว
  useEffect(() => {
    const courseCodeFromQr = new URLSearchParams(window.location.search).get(
      "code",
    );
    if (!courseCodeFromQr || qrRedeemHandled.current) return;

    qrRedeemHandled.current = true;
    setOpenedFromQr(true);
    setCode(courseCodeFromQr);
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    redeemCodeValue(courseCodeFromQr);
  }, [redeemCodeValue]);

  // handler สำหรับ submit form ของการกรอกรหัสด้วยตนเอง
  async function redeemCode(event) {
    event.preventDefault();
    await redeemCodeValue(code);
  }
  //แยกวันที่จัดกับวันที่ออก
  const courseDateParts = certificate?.courseDate?.split(" ถึง ");
  const displayCourseDate =
    courseDateParts?.[0] === courseDateParts?.[1]
      ? courseDateParts?.[0]
      : certificate?.courseDate;

  return (
    <Box
      className="course-code-shell"
      sx={{
        minHeight: "calc(100vh - 66px)",
        bgcolor: "#071B30",
        color: "#fff",
        pb: 6,
      }}
    >
      <Container maxWidth="md" sx={{ pt: { xs: 3, sm: 4 } }}>
        {/* แสดงตำแหน่งของผู้เรียนในขั้นตอนรับใบประกาศ */}
        <Stepper
          alternativeLabel
          sx={{
            maxWidth: 660,
            mx: "auto",
            mb: 3,
            "& .MuiStepLabel-label": {
              color: "#B8C7D6",
              fontSize: { xs: "0.65rem", sm: "0.85rem" },
              mt: 0.75,
            },
            "& .MuiStepLabel-label.Mui-active": {
              color: "#fff",
              fontWeight: 800,
            },
            "& .MuiStepLabel-label.Mui-completed": { color: "#B8C7D6" },
            "& .MuiStepIcon-root": {
              color: "#071B30",
              border: "2px solid #91A8BE",
              borderRadius: "50%",
            },
            "& .MuiStepIcon-root.Mui-active": {
              color: "#FFF200",
              border: "none",
            },
            "& .MuiStepIcon-root.Mui-completed": {
              color: "#55718D",
              border: "none",
            },
            "& .MuiStepIcon-text": { fill: "#fff", fontWeight: 800 },
            "& .MuiStepIcon-root.Mui-active .MuiStepIcon-text": {
              fill: "#0C2F53",
            },
            "& .MuiStepConnector-line": { borderColor: "#496987" },
          }}
          activeStep={certificate ? 2 : 1}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          className="course-code-panel"
          component="section"
          sx={{
            maxWidth: 760,
            mx: "auto",
            bgcolor: "#0C2F53",
            color: "#fff",
            borderTop: "4px solid #FFC600",
            borderBottom: "1px solid rgba(255,255,255,.22)",
            position: "relative",
          }}
        >
          <Box
            sx={{
              p: { xs: 2.5, sm: 2.75 },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 10,
                right: 12,
                opacity: 0.8,
                pointerEvents: "none",
              }}
            >
              <DepaMark size={46} />
            </Box>
            <Typography
              variant="h5"
              component="h1"
              fontWeight={700}
              sx={{ mb: 0.75, color: "#fff" }}
            >
              กรอกรหัสประจำคอร์ส
            </Typography>
            <Box sx={{ width: 48, height: 4, bgcolor: "#FFC600", mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: "#B8C7D6", mb: 2.5 }}>
              รหัสที่ผู้สอนแจ้งให้ ใช้ยืนยันว่าคุณเรียนคอร์สนี้ได้
            </Typography>

            <Typography variant="body2" sx={{ color: "#B8C7D6", mb: 1.5 }}>
              กรอกรหัสคอร์ส หรือสแกน QR code ที่ผู้จัดคอร์สส่งให้
            </Typography>
            {openedFromQr && (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                เปิดจาก QR แล้ว กำลังตรวจสอบรหัสและเตรียมดาวน์โหลดใบประกาศ
              </Alert>
            )}

            {/* ผู้เรียนเลือกกรอกรหัสเองหรือเปิดกล้องสแกน QR จากผู้จัดคอร์ส */}
            <Box component="form" onSubmit={redeemCode}>
              <Typography
                component="label"
                htmlFor="course-code"
                variant="body2"
                fontWeight={700}
                sx={{ display: "block", mb: 0.75 }}
              >
                รหัสประจำคอร์ส
              </Typography>
              <TextField
                id="course-code"
                fullWidth
                placeholder="เช่น [รหัส]"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="off"
                required
                inputProps={{ "aria-label": "รหัสประจำคอร์ส" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    bgcolor: "#07111D",
                    borderRadius: 1,
                    "& fieldset": { borderColor: "#91A8BE", borderWidth: 2 },
                    "&:hover fieldset": { borderColor: "#fff" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#FFF200",
                      borderWidth: 3,
                    },
                  },
                  "& input::placeholder": { color: "#8FAAC2", opacity: 1 },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: error ? "#FF9B9B" : "#B8C7D6",
                  mt: 0.5,
                }}
              >
                ตรวจสอบตัวอักษรและตัวเลขให้ถูกต้อง หากรหัสไม่ถูกต้อง
                กรุณาติดต่อผู้สอน
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: { xs: 1, sm: 1.5 },
                  mt: 2.25,
                }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    minHeight: 52,
                    px: { xs: 1, sm: 2 },
                    bgcolor: "#FFF200",
                    color: "#0C2F53",
                    borderRadius: 1,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    "&:hover": { bgcolor: "#FFC600" },
                  }}
                >
                  {submitting
                    ? "กำลังตรวจสอบรหัส…"
                    : "ยืนยันรหัสและรับใบประกาศ"}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  onClick={() => setScannerOpen(true)}
                  sx={{
                    minHeight: 52,
                    px: { xs: 1, sm: 2 },
                    bgcolor: "#FFF200",
                    color: "#0C2F53",
                    borderRadius: 1,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    "&:hover": { bgcolor: "#FFC600" },
                  }}
                >
                  สแกน QR code
                </Button>
              </Box>
            </Box>

            {mockEnabled && (
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#B8C7D6", mt: 1 }}
              >
                โหมดทดลองใช้รหัส DEPA-DEMO-2026
              </Typography>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            )}

            {/* เมื่อรหัสถูกต้อง แสดงข้อมูลใบประกาศและตัวอย่าง PDF */}
            {certificate && (
              <>
                <Alert severity="success" sx={{ mt: 2 }}>
                  ยืนยันรหัสสำเร็จ กำลังเตรียมใบประกาศของคุณ
                </Alert>
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderTop: "1px solid rgba(255,255,255,.22)",
                    borderBottom: "1px solid rgba(255,255,255,.22)",
                    color: "#B8C7D6",
                    py: 1.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    ข้อมูลใบประกาศ
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    ชื่อผู้รับ: {certificate.recipient}
                  </Typography>
                  <Typography variant="body2">
                    หลักสูตร: {certificate.courseName}
                  </Typography>
                  <Typography variant="body2">
                    วันที่ออก: {certificate.issuedAt}
                  </Typography>
                </Box>
                <CertificatePreview
                  certificate={certificate}
                  certificateRef={certificateRef}
                  downloading={downloading}
                  error={downloadError}
                  displayCourseDate={displayCourseDate}
                />
              </>
            )}
          </Box>
        </Box>
      </Container>

      <Dialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="qr-scanner-title"
      >
        <DialogTitle id="qr-scanner-title">สแกน QR code</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            วาง QR code ของคอร์สไว้ในกรอบ กล้องจะอ่านรหัสและตรวจสอบให้อัตโนมัติ
          </Typography>
          {scannerError ? (
            <Alert severity="error">{scannerError}</Alert>
          ) : (
            <Box
              sx={{
                overflow: "hidden",
                bgcolor: "#07111D",
                border: "2px solid #FFF200",
                aspectRatio: "4 / 3",
              }}
            >
              <Box
                component="video"
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="ภาพจากกล้องสำหรับสแกน QR code"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScannerOpen(false)}>ปิดกล้อง</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Secretcode;
