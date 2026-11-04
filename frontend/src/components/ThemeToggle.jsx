import { Button } from "@mui/material";
import { useThemeMode } from "../contexts/ThemeModeContext";

export default function ThemeToggle({ compact = false }) {
  const { mode, toggleTheme } = useThemeMode();
  const nextMode = mode === "dark" ? "light" : "dark";

  return (
    <Button
      className="theme-toggle"
      onClick={toggleTheme}
      variant="outlined"
      size="small"
      aria-label={`เปลี่ยนเป็นธีม${nextMode === "dark" ? "มืด" : "สว่าง"}`}
      title={`เปลี่ยนเป็นธีม${nextMode === "dark" ? "มืด" : "สว่าง"}`}
      sx={{
        color: "#fff",
        borderColor: "rgba(255,255,255,.5)",
        borderRadius: 0.75,
        minWidth: compact ? 38 : 0,
        px: compact ? 1 : 1.25,
        textTransform: "none",
        fontWeight: 700,
        "&:hover": { borderColor: "#FFC600", bgcolor: "rgba(255,255,255,.08)" },
      }}
    >
      {mode === "dark" ? "☀" : "☾"}
      {!compact && ` ${mode === "dark" ? "ธีมสว่าง" : "ธีมมืด"}`}
    </Button>
  );
}
