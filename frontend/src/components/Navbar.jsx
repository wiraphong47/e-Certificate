import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Logo from "../assets/LogoDEPA-01.png";
import ThemeToggle from "./ThemeToggle";

// แถบด้านบนของหน้าผู้เรียน; รับชื่อผู้ใช้และ callback ออกจากระบบจาก page
export default function Navbar({ user, onLogout }) {
  return (
    // แสดงโลโก้ ชื่อระบบ ชื่อผู้ใช้ และปุ่มออกจากระบบ
    <AppBar
      className="learner-navbar"
      position="static"
      elevation={0}
      sx={{
        bgcolor: "#071B30",
        color: "#fff",
        borderBottom: "1px solid rgba(255,255,255,.16)",
      }}
    >
      <Toolbar sx={{ minHeight: "66px !important", px: { xs: 2, sm: 5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            component="img"
            src={Logo}
            alt="depa"
            sx={{ display: "block", width: 82, height: "auto" }}
          />
          <Typography
            variant="h6"
            sx={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}
          >
            e-Certificate
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="body2"
          sx={{ color: "#B8C7D6", mr: 2, display: { xs: "none", sm: "block" } }}
        >
          {user?.name || "ผู้เรียน"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeToggle compact />
          <Button
            variant="outlined"
            onClick={onLogout}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,.55)",
              borderRadius: 1,
              fontWeight: 700,
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: "#FFC600",
                bgcolor: "rgba(255,255,255,.08)",
              },
            }}
          >
            ออกจากระบบ
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
