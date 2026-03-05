import { createTheme } from '@mui/material/styles'

const baseTokens = {
  primary: '#0079d6',
  backgroundLight: '#f5f7f8',
  backgroundDark: '#0f1a23',
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: baseTokens.primary },
    background: {
      default: baseTokens.backgroundLight,
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: baseTokens.primary },
    background: {
      default: baseTokens.backgroundDark,
      paper: '#0d2133',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})
