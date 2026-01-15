import * as XLSX from "xlsx";
import React from "react";
import { useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { environment } from "../../../Environments/Environment";

// Tarih aralığı (önceki ay)
function getPreviousMonthRange() {
  const now = new Date();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

  const firstDay = new Date(prevYear, prevMonth, 1);
  const lastDay = new Date(prevYear, prevMonth + 1, 0);

  const pad = (n: number) => (n < 10 ? "0" + n : n.toString());
  const formatLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { start: formatLocal(firstDay), end: formatLocal(lastDay) };
}

type IskartaTutar = {
  part: string;
  tutar: number;
  aciklama: string;
  firma: string;
};

const DecimalCell = ({ value }: { value?: number }) => (
  <span>
    {value !== undefined && value !== null
      ? value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
      : "-"}
  </span>
);

export default function IskartaRaporuPage() {
  const { start, end } = getPreviousMonthRange();
  const [fatdate, setFatdate] = useState<string>(start);
  const [fatdate1, setFatdate1] = useState<string>(end);
  const [rows, setRows] = useState<IskartaTutar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setError(null);
    setLoading(true);
    setRows([]);

    try {
      const qs = new URLSearchParams({
        fatdate,
        fatdate1,
      });

      const res = await fetch(
        environment.getApiUrl + `Muhasebe/IskartaPlasmot?${qs.toString()}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = (await res.json()) as IskartaTutar[];
      setRows(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  function downloadExcel() {
    if (!rows.length) return;

    const mappedData = rows.map((r) => ({
      "Parça Kodu": r.part,
      "Tutar": r.tutar,
      "Açıklama": r.aciklama,
    }));

    const ws = XLSX.utils.json_to_sheet(mappedData);
    const colWidths = Object.keys(mappedData[0]).map((key) => {
      let maxLength = key.length;
      mappedData.forEach((row) => {
        const cellValue = row[key as keyof typeof row];
        const len = cellValue ? cellValue.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      return { wch: maxLength + 2 };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Iskarta Raporu");
    XLSX.writeFile(wb, `iskarta_raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
<Container maxWidth="xl" sx={{ mt: 4 }}>
  {/* Tarih seçim ve butonlar */}
  <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
    <Grid container spacing={2} alignItems="flex-end">
      <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
        <TextField
          label="Fatura Başlangıç"
          type="date"
          fullWidth
          value={fatdate}
          onChange={(e) => setFatdate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
        <TextField
          label="Fatura Bitiş"
          type="date"
          fullWidth
          value={fatdate1}
          onChange={(e) => setFatdate1(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid sx={{ md: 6, xs: 12 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={fetchData} disabled={loading}>
            Getir
          </Button>
          <Button variant="outlined" onClick={() => setRows([])}>
            Temizle
          </Button>
          <Button variant="outlined" onClick={downloadExcel} disabled={!rows.length}>
            Excel İndir
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Paper>

  {error && (
    <Alert severity="error" sx={{ mb: 2 }}>
      Hata: {error}
    </Alert>
  )}

  {loading && (
    <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
      <CircularProgress />
    </Box>
  )}

  {!loading && rows.length > 0 && (
    <>

    <Paper elevation={2} sx={{ p: 2, mb: 4 }}>


      {/* Firma tablosu */}
        <Typography variant="h6" sx={{ mb: 1 }}>
            Firma Bazlı Toplamlar
        </Typography>
        <TableContainer>
            <Table size="small">
            <TableHead>
                <TableRow>
                <TableCell>Firma</TableCell>
                <TableCell align="right">Toplam Tutar</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(
                rows.reduce((acc, item) => {
                    if (!acc[item.firma]) acc[item.firma] = 0;
                    acc[item.firma] += item.tutar || 0;
                    return acc;
                }, {} as Record<string, number>)
                ).map(([firma, toplam]) => (
                <React.Fragment key={firma}>
                    {/* Açıklama satırı */}
                    <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                    <TableCell>{firma}</TableCell>
                    <TableCell align="right">
                        <DecimalCell value={toplam} />
                    </TableCell>
                    </TableRow>
                </React.Fragment>
                ))}

                {/* Genel toplam */}
                <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Genel Toplam:</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    <DecimalCell value={rows.reduce((sum, i) => sum + (i.tutar || 0), 0)} />
                </TableCell>
                </TableRow>
            </TableBody>
            </Table>
        </TableContainer>
        </Paper>

      {/* Açıklama tablosu */}
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
            Açıklama Bazlı Toplamlar
        </Typography>
        <TableContainer>
            <Table size="small">
            <TableHead>
                <TableRow>
                <TableCell>Açıklama</TableCell>
                <TableCell align="right">Toplam Tutar</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(
                rows.reduce((acc, item) => {
                    if (!acc[item.aciklama]) acc[item.aciklama] = 0;
                    acc[item.aciklama] += item.tutar || 0;
                    return acc;
                }, {} as Record<string, number>)
                ).map(([aciklama, toplam]) => (
                <React.Fragment key={aciklama}>
                    {/* Açıklama satırı */}
                    <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                    <TableCell>{aciklama}</TableCell>
                    <TableCell align="right">
                        <DecimalCell value={toplam} />
                    </TableCell>
                    </TableRow>
                </React.Fragment>
                ))}

                {/* Genel toplam */}
                <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Genel Toplam:</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    <DecimalCell value={rows.reduce((sum, i) => sum + (i.tutar || 0), 0)} />
                </TableCell>
                </TableRow>
            </TableBody>
            </Table>
        </TableContainer>
        </Paper>


      {/* 2️⃣ Parça tablosu */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
            Parça Bazlı Detaylar
        </Typography>
        <TableContainer>
            <Table size="small">
            <TableHead>
                <TableRow>
                <TableCell>Parça</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell>Firma</TableCell>
                <TableCell>Açıklama</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((r, i) => (
                <TableRow key={i}>
                    <TableCell>{r.part}</TableCell>
                    <TableCell align="right">
                    <DecimalCell value={r.tutar} />
                    </TableCell>
                    <TableCell>{r.firma}</TableCell>
                    <TableCell>{r.aciklama}</TableCell>
                </TableRow>
                ))}

                {/* 💰 Dip Toplam Satırı */}
                <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Dip Toplam:</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    <DecimalCell
                    value={rows.reduce((sum, i) => sum + (i.tutar || 0), 0)}
                    />
                </TableCell>
                <TableCell />
                </TableRow>
            </TableBody>
            </Table>
        </TableContainer>
        </Paper>

    </>
  )}
</Container>
  );
}
