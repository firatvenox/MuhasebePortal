// src/App.tsx (veya ana layout dosyanız)
import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { AppThemeProvider } from "./ThemeContext";
import Sidebar from "./Sidebar";
import Header from "./Headers";
import { Outlet, useLocation } from "react-router";

const drawerWidthOpen = 260;
const drawerWidthClosed = 60;

function App() {
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const location = useLocation();

  const pageTitles: Record<string, string> = {
    "/satis-raporu-maliyetli": "Satış Raporu Ermetal",
    "/satis-raporu-maliyetli-plasmot": "Satış Raporu Plasmot",
    "/anasayfa": "Anasayfa",
    "/ciro-raporu": "Ciro Raporu",
    "/dakika-maliyet": "Dakika Maliyet Raporu",
  };

  const pageTitle = pageTitles[location.pathname] || "Uygulama";
  const sidebarWidth = open ? drawerWidthOpen : drawerWidthClosed;

  return (
    <AppThemeProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar open={open} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: `25px`,
            width: "100%",
            transition: (theme) =>
              theme.transitions.create("margin-left", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            backgroundColor: (theme) => theme.palette.background.default,
            minHeight: "100vh",
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header
            pageTitle={pageTitle}
            sidebarWidth={sidebarWidth}
            toggleDrawer={toggleDrawer}
          />

          <Toolbar />

          <Box sx={{ flexGrow: 1, p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </AppThemeProvider>
  );
}

export default App;
