import { Box, Button, Drawer, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/LogoDEPA-01.png";
import ThemeToggle from "./ThemeToggle";

const items = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "คอร์ส", path: "/admin/courses" },
];

// Responsive admin navigation; the page owns drawer state and callbacks.
export default function AdminSidebar({
  activeItem,
  user,
  onLogout,
  mobileMenuOpen = false,
  onToggleMobileMenu,
  onCloseMobileMenu,
}) {
  return (
    <>
      {/* Sidebar for tablets and desktop screens. */}
      <Box
        className="admin-sidebar"
        component="aside"
        sx={{
          display: { xs: "none", sm: "flex" },
          flexDirection: "column",
          width: 200,
          flexShrink: 0,
          position: "fixed",
          inset: "0 auto 0 0",
          height: "100vh",
          overflowY: "auto",
          zIndex: (theme) => theme.zIndex.appBar,
          bgcolor: "#071B30",
          color: "#fff",
          borderRight: "1px solid rgba(255,255,255,.16)",
          p: 1.75,
        }}
      >
        <Box sx={{ mb: 2.25, px: 0.75 }}>
          <Box
            component="img"
            src={Logo}
            alt="depa"
            sx={{ display: "block", width: 82, height: "auto" }}
          />
          <Typography
            sx={{
              mt: 0.75,
              fontWeight: 800,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            e-Certificate
          </Typography>
        </Box>
        <ThemeToggle />
        <Stack component="nav" aria-label="เมนูผู้ดูแล" spacing={0.5}>
          {items.map(({ label, path }) => {
            const active = activeItem === label;
            return (
              <Box
                key={label}
                component={RouterLink}
                to={path}
                aria-current={active ? "page" : undefined}
                sx={{
                  minHeight: 38,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  borderLeft: active
                    ? "4px solid #FFF200"
                    : "4px solid transparent",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 800 : 500,
                  "&:hover": {
                    color: "#FFC600",
                    bgcolor: "rgba(255,255,255,.08)",
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ borderTop: "1px solid rgba(255,255,255,.16)", pt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#B8C7D6",
              mb: 0.75,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.name || "ผู้ดูแลระบบ"}
          </Typography>
          <Button
            onClick={onLogout}
            size="small"
            sx={{
              p: 0,
              minWidth: 0,
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { color: "#FFC600" },
            }}
          >
            ออกจากระบบ
          </Button>
        </Box>
      </Box>

      {/* Compact mobile header and slide-in navigation drawer. */}
      <Box
        className="admin-mobile-header"
        component="header"
        sx={{
          display: { xs: "flex", sm: "none" },
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          width: "100%",
          minHeight: 60,
          px: 1.5,
          py: 0.75,
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#071B30",
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,.16)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            component="img"
            src={Logo}
            alt="depa"
            sx={{ display: "block", width: 46, height: "auto" }}
          />
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
            e-Certificate
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <ThemeToggle compact />
          <Button
            onClick={onToggleMobileMenu}
            variant="outlined"
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-navigation"
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,.55)",
              borderRadius: 0.75,
              minWidth: 0,
              px: 1.25,
              py: 0.5,
              gap: 0.75,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{ fontSize: 17, lineHeight: 1 }}
            >
              ☰
            </Box>
            เมนู
          </Button>
        </Box>
      </Box>
      <Drawer
        className="admin-drawer"
        id="admin-mobile-navigation"
        anchor="left"
        open={mobileMenuOpen}
        onClose={onCloseMobileMenu}
        slotProps={{
          paper: {
            sx: {
              width: "min(82vw, 300px)",
              maxWidth: "82vw",
              p: 2,
              bgcolor: "#0C2F53",
              color: "#fff",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pb: 2,
            borderBottom: "1px solid rgba(255,255,255,.2)",
          }}
        >
          <Box
            component="img"
            src={Logo}
            alt="depa"
            sx={{ display: "block", width: 60, height: "auto" }}
          />
          <Typography fontWeight={800} sx={{ color: "#fff" }}>
            e-Certificate
          </Typography>
        </Box>
        <Box sx={{ py: 1.5 }}>
          <ThemeToggle />
        </Box>
        <Stack
          component="nav"
          aria-label="เมนูผู้ดูแล"
          spacing={0.5}
          sx={{ mt: 1.5 }}
        >
          {items.map(({ label, path }) => {
            const active = activeItem === label;
            return (
              <Box
                key={label}
                component={RouterLink}
                to={path}
                onClick={onCloseMobileMenu}
                aria-current={active ? "page" : undefined}
                sx={{
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  borderLeft: active
                    ? "4px solid #FFF200"
                    : "4px solid transparent",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: active ? 800 : 500,
                  "&:hover": {
                    color: "#FFC600",
                    bgcolor: "rgba(255,255,255,.08)",
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ borderTop: "1px solid rgba(255,255,255,.2)", pt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "#B8C7D6", mb: 0.75 }}
          >
            {user?.name || "ผู้ดูแลระบบ"}
          </Typography>
          <Button
            onClick={onLogout}
            size="small"
            sx={{
              p: 0,
              minWidth: 0,
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            ออกจากระบบ
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
