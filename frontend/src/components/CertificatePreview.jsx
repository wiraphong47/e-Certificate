import { Alert, Box, Stack, Typography } from "@mui/material";

// คอมโพเนนต์แสดงใบประกาศเท่านั้น; page เป็นผู้ส่งข้อมูล, ref และสถานะเข้ามา
export default function CertificatePreview({
  certificate,
  certificateRef,
  downloading,
  error,
  displayCourseDate,
}) {
  return (
    <Stack spacing={1.5} sx={{ mt: 3 }}>
      {/* page ใช้ ref ของกล่องนี้จับภาพไปสร้างเป็น PDF */}
      <Box
        ref={certificateRef}
        sx={{
          width: "100%",
          height: "auto",
          aspectRatio: "297 / 210",
          boxSizing: "border-box",
          position: "relative",
          p: { xs: 2, sm: 3, md: 5 },
          border: "3px double #0C2F53",
          bgcolor: "#fffdf4",
          backgroundImage: certificate.templateUrl
            ? `url("${certificate.templateUrl}")`
            : "none",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          color: "#0C2F53",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          overflow: "hidden",
          gap: { xs: 0.5, sm: 1 },
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "1rem", sm: "1.5rem", md: "2rem" },
            fontWeight: 700,
          }}
        >
          ประกาศนียบัตร
        </Typography>
        <Typography
          sx={{ fontSize: { xs: "0.65rem", sm: "0.85rem", md: "1rem" } }}
        >
          มอบให้แก่
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "0.9rem", sm: "1.25rem", md: "1.75rem" },
            fontWeight: 700,
          }}
        >
          {certificate.recipient}
        </Typography>
        <Typography
          sx={{ fontSize: { xs: "0.6rem", sm: "0.8rem", md: "1rem" } }}
        >
          เพื่อแสดงว่าได้ผ่านการอบรมหลักสูตร
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "0.7rem", sm: "1rem", md: "1.35rem" },
            fontWeight: 600,
          }}
        >
          {certificate.courseName}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "0.55rem", sm: "0.7rem", md: "0.85rem" },
            mt: 1,
          }}
        >
          วันที่จัด {displayCourseDate} · วันที่ออก {certificate.issuedAt}{" "}
        </Typography>
      </Box>

      {/* แสดงสถานะการดาวน์โหลดหรือแจ้งข้อผิดพลาดที่ page ส่งมา */}
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {downloading
          ? "กำลังสร้างและดาวน์โหลด PDF…"
          : "ใบประกาศ PDF ดาวน์โหลดอัตโนมัติแล้ว"}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
