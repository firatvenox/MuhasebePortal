// components/FullscreenLoading.tsx
import { Box, CircularProgress } from "@mui/material";

const FullscreenLoading = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255,255,255,0.7)", // Koyu tema için rgba(0,0,0,0.5)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1500, // MUI Dialog üzeri
      }}
    >
      <CircularProgress size={60} thickness={5} color="primary" />
    </Box>
  );
};

export default FullscreenLoading;
