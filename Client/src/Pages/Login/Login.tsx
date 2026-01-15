// src/Pages/Auth/Login.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router";
import { environment } from "../../../Environments/Environment";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(environment.getApiUrl + "Auth/login", {
        email,
        password,
      });

      localStorage.setItem("accessToken", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("adSoyad", response.data.adSoyad);
      localStorage.setItem("departman", response.data.departman);
      if(response.data.departman == "MALİ İŞLER MÜDÜRLÜĞÜ" || email == "firat.devran" || response.data.departman == "MUHASEBE"){
        navigate("/");
      }
      else{
          setError("Giriş yetkiniz bulunmamaktadır, lütfen BT & BS departmanına iş isteği açınız.");
      }
    } catch (err: any) {
      setError(
        err.response?.data || "Giriş sırasında bir hata oluştu. LDAP doğrulamasını kontrol et."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(to right, #667eea, #764ba2)`,
        backgroundImage: `url('/wallpaper.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        p: 2,
      }}
    >
      <Paper
  elevation={12}
  sx={{
    p: 5,
    borderRadius: 4,
    maxWidth: 400,
    width: "100%",
    bgcolor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
  }}
>
  <Typography variant="h4" fontWeight={700} mb={3} textAlign="center" color="#333">
    Hoşgeldiniz
  </Typography>

  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

  <form
  onSubmit={(e) => {
    e.preventDefault();
    handleLogin();
  }}
>
  <TextField
    label="Email / Kullanıcı Adı"
    fullWidth
    margin="normal"
    variant="outlined"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    autoComplete="username" 
    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
  />

  <TextField
    label="Şifre"
    type="password"
    fullWidth
    margin="normal"
    variant="outlined"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    autoComplete="current-password"
    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
  />

  <Button
    type="submit"
    variant="contained"
    color="primary"
    fullWidth
    sx={{
      mt: 3,
      py: 1.5,
      borderRadius: 2,
      fontWeight: 600,
      fontSize: "1rem",
      background: "linear-gradient(45deg, #667eea, #764ba2)",
      boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
      "&:hover": { background: "linear-gradient(45deg, #5563c1, #61348f)" },
    }}
    disabled={loading}
  >
    {loading ? <CircularProgress size={24} /> : "Giriş Yap"}
  </Button>
</form>

</Paper>

    </Box>
  );
};

export default Login;
