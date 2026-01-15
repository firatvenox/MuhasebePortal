// src/components/Header/Header.tsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme, // Tema'ya erişmek için
  useMediaQuery,
  styled, // Responsive tasarım için
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router";
import { KeyboardArrowDown } from "@mui/icons-material";

type HeaderProps = {
  pageTitle: string;
  sidebarWidth: number;
  toggleDrawer: () => void;
};

export default function Header({ pageTitle, sidebarWidth, toggleDrawer }: HeaderProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const adSoyad = localStorage.getItem("adSoyad") || "Kullanıcı";

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
    handleMenuClose();
  };

  function stringAvatar(name: string) {
    const parts = name.split(" ");
    return {
      sx: {
        bgcolor: '#e0e5fa',
      },
      children:
        parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0],
    };
  }

    const AvatarBox = styled(Avatar)(({  }) => ({
        backgroundColor: '#e0e5fa',
        color: " #000000ff",
        fontWeight: 200,
    }));

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        fontFamily: 'Poppins , sans-serif',
        zIndex: theme.zIndex.drawer + 1,
        width: `calc(100% - ${sidebarWidth}px)`,
        ml: `${sidebarWidth}px`,
        transition: theme.transitions.create(["width", "margin-left"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            aria-label="toggle sidebar"
            size="large"
            sx={{
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
                userSelect: "none",
                fontWeight: 600,
                backgroundColor: "#e0e5fa",
                color: theme.palette.text.primary,
                display: "inline-block", // Yazıyı saran kutu için
                padding: "4px 12px", // Kutunun iç dolgusu
                borderRadius: "8px", // Köşe yuvarlaklığı
                maxWidth: "100%", // Taşmaları önlemek için
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
            >
            {pageTitle.toUpperCase()}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
          

          <IconButton
            onClick={handleMenuOpen}
            size="small"
            aria-controls={openMenu ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={openMenu ? "true" : undefined}
            sx={{ p: 1 }}
          >
            <AvatarBox {...stringAvatar(adSoyad)} 
              alt={adSoyad}
              src="/static/images/avatar/1.jpg"
              sx={{ width: 40, height: 40 }}
            />
            {!isMobile && (
            <>
              <Typography variant="body1" noWrap sx={{ color: theme.palette.text.secondary, pl: 1, fontWeight: 600 }}>
                {adSoyad}
              </Typography>
            </>
            )}
          <KeyboardArrowDown />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ elevation: 3, sx: { mt: 1.5, minWidth: 140, borderRadius: 2 } }}
          >
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Çıkış Yap
            </MenuItem>
          </Menu>
        
        </Box>
      </Toolbar>
    </AppBar>
  );
}