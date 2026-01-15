// src/components/Sidebar/Sidebar.tsx
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  useTheme,
} from "@mui/material";
import {
  AttachMoney,
  PointOfSale,
  RecyclingSharp,
  WatchSharp,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router";

const drawerWidthOpen = 260;
const drawerWidthClosed = 60;

type SidebarProps = {
  open: boolean;
};

const menuItems = [
  { divider: true, sectionTitle: "Ermetal" },
  { to: "/satis-raporu-maliyetli", icon: <PointOfSale />, text: "Satış Raporu Maliyetli" },
  { to: "/satis-raporu-ermetal-test", icon: <PointOfSale />, text: "Satış Raporu Test" },
  { to: "/ciro-raporu", icon: <AttachMoney />, text: "Ciro Raporu" },
  { to: "/aktif-kullanicilar", icon: <AttachMoney />, text: "Aktif Kullanıcılar" },
  { divider: true, sectionTitle: "Plasmot" },
  { to: "/satis-raporu-maliyetli-plasmot", icon: <PointOfSale />, text: "Satış Raporu Maliyetli" },
  { to: "/iskarta-raporu-plasmot", icon: <RecyclingSharp />, text: "Iskarta Raporu" },
  { divider: true, sectionTitle: "Erkalıp" },
  { to: "/dakika-maliyet", icon: <WatchSharp />, text: "Dakika Maliyet Raporu" },
];

export default function Sidebar({ open }: SidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidthOpen : drawerWidthClosed,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        "& .MuiDrawer-paper": {
          width: open ? drawerWidthOpen : drawerWidthClosed,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: "hidden",
          height: "100vh",
          backgroundColor: "#2c3444",
          borderRight: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: theme.palette.grey[100],
        },
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-start" : "center",
            px: open ? 2 : 1,
            py: 0,
            minHeight: 70,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {open && (
            <img src="/ermetal_logo_beyaz.png" alt="Ermetal Logo" style={{ height: 40 }} />
          )}
          {!open && (
            <img src="/ermetal_logo_beyaz.png" alt="Ermetal Logo" style={{ height: 10 }} />
          )}
        </Toolbar>

        <List sx={{ px: 0, pt: 1 }}>
          {menuItems.map((item, idx) =>
            item.divider ? (
              <Box key={`divider-${idx}`} sx={{ my: 1.5 }}>
                {item.sectionTitle && open && (
                <Divider
                  textAlign="left"
                  sx={{
                    '&::before, &::after': {
                      borderColor: '#3a4a60',
                    },
                    color: 'rgba(255, 255, 255, 1)', // yazı rengi
                    fontWeight: 600,
                  }}
                >
                     {item.sectionTitle.toUpperCase()}
                  </Divider>
                )}
              </Box>
            ) : (
              <ListItemButton
                key={item.to}
                onClick={() => navigate(item.to!)}
                sx={{
                  borderRadius: 1,
                  my: 0.5,
                  px: 2,
                  py: 1.2,
                  backgroundColor:
                    location.pathname === item.to ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  color:
                    location.pathname === item.to
                      ? theme.palette.common.white
                      : theme.palette.grey[100],
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: theme.palette.common.white,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.to ? "#fff" : "#79829c",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: location.pathname === item.to ? 600 : 300,
                      color: location.pathname === item.to ? "#fff" : "#79829c",
                    }}
                  />
                )}
              </ListItemButton>
            )
          )}
        </List>
      </Box>
    </Drawer>
  );
}
