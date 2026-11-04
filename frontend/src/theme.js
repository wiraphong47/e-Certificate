import { createTheme } from '@mui/material/styles'

// เก็บสีประจำ depa ไว้จุดเดียว เพื่อให้หน้าอื่นเรียกใช้สีชุดเดียวกัน
export const depaColors = {
  yellow: '#FFF200',
  yellowSecondary: '#FFC600',
  blue: '#0C2F53',
  background: '#071B30',
  textSecondary: '#B8C7D6',
}

// กำหนดสีหลักของ Material UI ให้กับปุ่มและองค์ประกอบมาตรฐาน
const theme = createTheme({
  palette: {
    primary: { main: depaColors.yellow, contrastText: depaColors.blue },
    secondary: { main: depaColors.blue, contrastText: '#FFFFFF' },
    warning: { main: depaColors.yellowSecondary, contrastText: depaColors.blue },
    background: { default: depaColors.background, paper: depaColors.blue },
    text: { primary: '#FFFFFF', secondary: depaColors.textSecondary },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #FFFFFF',
            outlineOffset: 2,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid #FFFFFF',
            outlineOffset: 2,
          },
          '&:hover': { color: depaColors.yellowSecondary },
        },
      },
    },
    // Keep status messages readable against the white page background.
    MuiAlert: {
      styleOverrides: {
        standardInfo: {
          color: '#D9ECFF',
          backgroundColor: 'rgba(25, 118, 210, 0.16)',
          border: '1px solid rgba(100, 181, 246, 0.45)',
        },
        standardSuccess: {
          color: '#DDF6E5',
          backgroundColor: 'rgba(46, 125, 50, 0.18)',
          border: '1px solid rgba(129, 199, 132, 0.45)',
        },
        standardError: {
          color: '#FFE4E4',
          backgroundColor: 'rgba(211, 47, 47, 0.16)',
          border: '1px solid rgba(255, 107, 107, 0.55)',
          '& .MuiAlert-icon': { color: '#FF6B6B' },
        },
      },
    },
  },
})

export default theme
