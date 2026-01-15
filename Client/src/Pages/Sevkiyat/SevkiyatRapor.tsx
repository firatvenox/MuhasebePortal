import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import * as XLSX from "xlsx";
import { environment } from "../../../Environments/Environment";

interface ApiAmbar {
  ambarAdi: string;
  kapasite: number;
  varolanAgirlik: number;
  ambarHacim: number;
  ambarListe: any[];
}

interface RaporRow {
  ad: string;
  dolulukOrani: number;
  toplamAgirlik: number;
  toplamKapasite: number;
}

interface RaporData {
  SVK: {
    toplam: RaporRow;
    ambarlar: RaporRow[];
  };
  SVY: {
    toplam: RaporRow;
    ambarlar: RaporRow[];
  };
}

const SevkiyatRapor: React.FC = () => {
  const [allData, setAllData] = useState<ApiAmbar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"SVK" | "SVY">("SVK");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(environment.getApiUrl + "Ambar/hacim");
        const data: ApiAmbar[] = await response.json();
        setAllData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching ambar data:", error);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


const raporData = useMemo(() => {
  const result: RaporData = {
    SVK: { toplam: { ad: "🏭 Merkez Bina (Toplam)", dolulukOrani: 0, toplamAgirlik: 0, toplamKapasite: 0 }, ambarlar: [] },
    SVY: { toplam: { ad: "🏢 Yeni Bina (Toplam)", dolulukOrani: 0, toplamAgirlik: 0, toplamKapasite: 0 }, ambarlar: [] },
  };

  const processType = (type: "SVK" | "SVY") => {
    // 1) Type'a göre filtrele
    const filtered = allData.filter((a) =>
      a.ambarAdi?.toUpperCase().startsWith(type)
    );

    // 2) Blok gruplama
    const blokGruplari: Record<string, { agirlik: number; kapasite: number }> = {};

    filtered.forEach((ambar) => {
      const kod = ambar.ambarAdi.toUpperCase();

      // 📌 SVK + 4. harf → SVKA
      const blokKey =
        kod.length >= 4 ? kod.substring(0, 4) : kod.substring(0, 3);

      if (!blokGruplari[blokKey]) {
        blokGruplari[blokKey] = { agirlik: 0, kapasite: 0 };
      }

      blokGruplari[blokKey].agirlik += ambar.varolanAgirlik ?? 0;
      blokGruplari[blokKey].kapasite += ambar.kapasite ?? 0;

      // Toplam güncelle
      result[type].toplam.toplamAgirlik += ambar.varolanAgirlik ?? 0;
      result[type].toplam.toplamKapasite += ambar.kapasite ?? 0;
    });

    // 3) Blok sonuçlarını tabloya ekle
    Object.keys(blokGruplari).forEach((blok) => {
      const g = blokGruplari[blok];
      const doluluk = g.kapasite > 0 ? (g.agirlik / g.kapasite) * 100 : 0;

      result[type].ambarlar.push({
        ad: blok, // Örn: "SVKA"
        dolulukOrani: doluluk,
        toplamAgirlik: g.agirlik,
        toplamKapasite: g.kapasite,
      });
    });

    // 4) Toplam doluluk
    if (result[type].toplam.toplamKapasite > 0) {
      result[type].toplam.dolulukOrani =
        (result[type].toplam.toplamAgirlik /
          result[type].toplam.toplamKapasite) *
        100;
    }
  };

  processType("SVK");
  processType("SVY");

  return result;
}, [allData]);


  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // SVK Sheet
    const svkRows = [
      ["Ambar Adı", "Doluluk Oranı (%)", "Toplam Ağırlık (kg)", "Toplam Kapasite (kg)"],
      [
        raporData.SVK.toplam.ad,
        raporData.SVK.toplam.dolulukOrani.toFixed(2),
        raporData.SVK.toplam.toplamAgirlik,
        raporData.SVK.toplam.toplamKapasite,
      ],
      [],
      ...raporData.SVK.ambarlar.map((r) => [
        r.ad,
        r.dolulukOrani.toFixed(2),
        r.toplamAgirlik,
        r.toplamKapasite,
      ]),
    ];

    const svkSheet = XLSX.utils.aoa_to_sheet(svkRows);
    XLSX.utils.book_append_sheet(workbook, svkSheet, "SVK - Merkez");

    // SVY Sheet
    const svyRows = [
      ["Ambar Adı", "Doluluk Oranı (%)", "Toplam Ağırlık (kg)", "Toplam Kapasite (kg)"],
      [
        raporData.SVY.toplam.ad,
        raporData.SVY.toplam.dolulukOrani.toFixed(2),
        raporData.SVY.toplam.toplamAgirlik,
        raporData.SVY.toplam.toplamKapasite,
      ],
      [],
      ...raporData.SVY.ambarlar.map((r) => [
        r.ad,
        r.dolulukOrani.toFixed(2),
        r.toplamAgirlik,
        r.toplamKapasite,
      ]),
    ];

    const svySheet = XLSX.utils.aoa_to_sheet(svyRows);
    XLSX.utils.book_append_sheet(workbook, svySheet, "SVY - Yeni");

    XLSX.writeFile(workbook, `Sevkiyat_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const renderTable = (data: RaporRow[], isToplam: boolean = false) => (
    <TableContainer
      component={Paper}
      sx={{
        bgcolor: "rgba(15, 23, 42, 0.8)",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(59, 130, 246, 0.15)" }}>
            <TableCell sx={{ color: "#60a5fa", fontWeight: 700, fontSize: "12px", padding: "12px" }}>
              Ambar Adı
            </TableCell>
            <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700, fontSize: "12px", padding: "12px" }}>
              Doluluk Oranı (%)
            </TableCell>
            <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700, fontSize: "12px", padding: "12px" }}>
              Toplam Ağırlık (kg)
            </TableCell>
            <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700, fontSize: "12px", padding: "12px" }}>
              Toplam Kapasite (kg)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => {
            const isTotalRow = idx === 0 && isToplam;
            const dolulukColor =
              row.dolulukOrani > 80 ? "#ff5252" : row.dolulukOrani > 60 ? "#ff9800" : row.dolulukOrani > 30 ? "#ffd54f" : "#66bb6a";

            return (
              <TableRow
                key={idx}
                sx={{
                  bgcolor: isTotalRow ? "rgba(34, 197, 94, 0.15)" : idx % 2 === 0 ? "transparent" : "rgba(59, 130, 246, 0.05)",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                  fontWeight: isTotalRow ? 700 : 400,
                }}
              >
                <TableCell sx={{ color: isTotalRow ? "#22c55e" : "#e5e7eb", fontWeight: isTotalRow ? 700 : 400, fontSize: "13px", padding: "12px" }}>
                  {row.ad}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: isTotalRow ? "#22c55e" : dolulukColor, fontWeight: isTotalRow ? 700 : 400, fontSize: "13px", padding: "12px" }}
                >
                  {row.dolulukOrani.toFixed(2)}%
                </TableCell>
                <TableCell align="right" sx={{ color: isTotalRow ? "#22c55e" : "#9ca3af", fontWeight: isTotalRow ? 700 : 400, fontSize: "13px", padding: "12px" }}>
                  {row.toplamAgirlik.toLocaleString("tr-TR")}
                </TableCell>
                <TableCell align="right" sx={{ color: isTotalRow ? "#22c55e" : "#9ca3af", fontWeight: isTotalRow ? 700 : 400, fontSize: "13px", padding: "12px" }}>
                  {row.toplamKapasite.toLocaleString("tr-TR")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0f172a">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", padding: "24px", color: "#e5e7eb" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: "32px" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(90deg, #60a5fa, #3b82f6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          📊 Sevkiyat Raporu
        </Typography>
        <Stack direction="row" gap={2}>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            sx={{
              bgcolor: "#10b981",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            📥 Excel Olarak İndir
          </Button>
          <Button
            variant="contained"
            onClick={() => setModalOpen(true)}
            sx={{
              bgcolor: "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            👁️ Rapor Görüntüle
          </Button>
        </Stack>
      </Stack>

      {/* SVK Section */}
      <Box sx={{ marginBottom: "48px" }}>
        <Typography
          variant="h6"
          sx={{
            marginBottom: "16px",
            fontWeight: 700,
            padding: "12px 16px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 116, 144, 0.2))",
            borderLeft: "4px solid #3b82f6",
            borderRadius: "8px",
          }}
        >
          🏭 Merkez Bina (SVK)
        </Typography>
        {renderTable([raporData.SVK.toplam, ...raporData.SVK.ambarlar], true)}
      </Box>

      {/* SVY Section */}
      <Box sx={{ marginBottom: "48px" }}>
        <Typography
          variant="h6"
          sx={{
            marginBottom: "16px",
            fontWeight: 700,
            padding: "12px 16px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(88, 28, 135, 0.2))",
            borderLeft: "4px solid #8b5cf6",
            borderRadius: "8px",
          }}
        >
          🏢 Yeni Bina (SVY)
        </Typography>
        {renderTable([raporData.SVY.toplam, ...raporData.SVY.ambarlar], true)}
      </Box>

      {/* Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            backgroundImage: "none",
            borderRadius: "16px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "rgba(59, 130, 246, 0.1)",
            color: "#60a5fa",
            fontWeight: 700,
            borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          📊 Sevkiyat Raporu Detayı
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px" }}>
          <Stack gap={3}>
            <Stack direction="row" gap={2}>
              <Button
                variant={modalTab === "SVK" ? "contained" : "outlined"}
                onClick={() => setModalTab("SVK")}
                sx={{
                  bgcolor: modalTab === "SVK" ? "#3b82f6" : "transparent",
                  color: "#fff",
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: "#3b82f6",
                }}
              >
                🏭 Merkez Bina
              </Button>
              <Button
                variant={modalTab === "SVY" ? "contained" : "outlined"}
                onClick={() => setModalTab("SVY")}
                sx={{
                  bgcolor: modalTab === "SVY" ? "#8b5cf6" : "transparent",
                  color: "#fff",
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: "#8b5cf6",
                }}
              >
                🏢 Yeni Bina
              </Button>
            </Stack>
            {modalTab === "SVK" && renderTable([raporData.SVK.toplam, ...raporData.SVK.ambarlar], true)}
            {modalTab === "SVY" && renderTable([raporData.SVY.toplam, ...raporData.SVY.ambarlar], true)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: "#60a5fa", fontWeight: 600 }}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SevkiyatRapor;
