// src/contexts/ThemeContext.tsx (Örnek yol)
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Sidebar genişliklerini burada da tanımla, App.tsx ile senkronize olmalı
const drawerWidthOpen = 260;

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#4A90E2", // Canlı mavi tonu
      light: "#6CA2E8",
      dark: "#3B7BD1",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FF6B6B", // Vurgu için kırmızımsı ton
      light: "#FF8E8E",
      dark: "#E05A5A",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8F9FA", // Açık gri uygulama arka planı
      paper: "#FFFFFF", // Kartlar ve kutular için beyaz
    },
    text: {
      primary: "#333333", // Ana metin rengi
      secondary: "#666666", // İkincil metin rengi
    },
    error: {
      main: "#D32F2F", // Hata mesajları için
    },
    divider: "rgba(0, 0, 0, 0.12)", // Daha belirgin divider
  },
  typography: {
    fontFamily: "'Nata Sans', sans-serif", // Modern bir font
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
    caption: {
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Daha yuvarlak butonlar
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8, // Daha yuvarlak input alanları
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Sidebar için daha hafif bir gölge
          backgroundColor: "#2e3a4e", // Sidebar'ın kendi arka plan rengi
          color: "#e0e0e0", // Sidebar metin rengi
          width: drawerWidthOpen, // Varsayılan açık genişlik
          // transition handled by component itself
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF", // Header için beyaz arka plan
          color: "#333333", // Header metin rengi
          borderBottom: "1px solid #E0E0E0", // Header altında ince çizgi
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)", // Header için hafif gölge
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Menü öğeleri için yuvarlaklık
          "&.Mui-selected": {
            backgroundColor: "rgba(74, 144, 226, 0.1)", // Primary rengin %10 şeffaflığı
            color: "#4A90E2", // Primary renkli metin
            "& .MuiListItemIcon-root": {
              color: "#4A90E2", // Primary renkli ikon
            },
            "&:hover": {
              backgroundColor: "rgba(74, 144, 226, 0.15)", // Hafif daha koyu hover
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid rgba(255,255,255,0.2)", // Sidebar avatarında hafif border
        }
      }
    }
  },
});

type AppThemeProviderProps = {
  children: React.ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline /> {/* Global CSS sıfırlaması */}
      {children}
    </ThemeProvider>
  );
}