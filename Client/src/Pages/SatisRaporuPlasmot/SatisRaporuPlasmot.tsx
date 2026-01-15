import * as React from "react";
import * as XLSX from "xlsx";
import { useMemo, useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from "@mui/material";
import { environment } from "../../../Environments/Environment";

type SatisRaporu = {
  temp5_xfirma?: string;
  temp5_xpart?: string;
  temp5_cmsort?: string;
  temp5_xgrup?: string;
  temp5_xUM?: string;
  temp5_xtop?: number;
  temp5_brfiyat?: number;
  temp5_eskbrfiyat?: number;
  temp5_iskarta?: number;
  temp5_malzeme?: number;
  temp5_iscilik?: number;
  temp5_ek?: number;
  temp5_urungrubu?: string;
  temp5_toplammaliyet?: number;
  temp5_toplamMalzeme?: number;
  temp5_toplammal?: number;
  temp5_yonetimToplam?: number;
  temp5_xgeneltop?: number;
  temp5_csl?: number;
  // FE hesaplanan
  temp5_yonetimOran?: number; // yüzde olarak (ör: 12.34)
};

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

const DecimalCell = ({ value, suffix }: { value?: number; suffix?: string }) => (
  <span>
    {value !== undefined && value !== null
      ? (Number.isFinite(value) ? value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-") + (suffix ?? "")
      : "-"}
  </span>
);

export default function SatisRaporuMaliyetliPage() {
  const { start, end } = getPreviousMonthRange();

  const [fatdate, setFatdate] = useState<string>(start);
  const [fatdate1, setFatdate1] = useState<string>(end);
  const [gun, setGun] = useState<string>(start);
  const [gun1, setGun1] = useState<string>(end);
  const [yonetimOran, setYonetimOran] = useState<number>(0);

  const [rows, setRows] = useState<SatisRaporu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [firmaFilter, setFirmaFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  async function fetchData() {
    setError(null);
    setLoading(true);
    setRows([]);

    try {
      const qs = new URLSearchParams({
        fatdate,
        fatdate1,
        gun,
        gun1,
        yonetimOran: yonetimOran.toString(),
      });

      const url = `${environment.getApiUrl}Muhasebe/SatisRaporuMaliyetliPlasmot?${qs.toString()}`;
      // console.debug("Fetching:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      const data = (await res.json()) as SatisRaporu[];

      // FE'de Yönetim Oranını hesapla (yüzde). Güvenlik: sıfıra bölünme kontrolü
      const mapped = (data || []).map((d) => {
        const topMal = d.temp5_toplammaliyet ?? d.temp5_toplamMalzeme ?? 0;
        const yonetimTop = d.temp5_yonetimToplam ?? 0;
        const oran = topMal !== 0 ? (yonetimTop / topMal) * 100 : 0;
        return { ...d, temp5_yonetimOran: Number.isFinite(oran) ? Number(oran) : 0 };
      });

      setRows(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !term ||
        (r.temp5_xfirma ?? "").toLowerCase().includes(term) ||
        (r.temp5_cmsort ?? "").toLowerCase().includes(term) ||
        (r.temp5_xpart ?? "").toLowerCase().includes(term);
      const matchesFirma = !firmaFilter || r.temp5_xfirma === firmaFilter;
      return matchesSearch && matchesFirma;
    });
  }, [rows, searchTerm, firmaFilter]);

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const uniqueFirmalar = Array.from(new Set(rows.map((r) => r.temp5_xfirma))).filter(Boolean) as string[];

  function downloadExcel() {
    if (!rows.length) return;

    const mappedData = rows.map((r) => ({
      Firma: r.temp5_xfirma,
      "Satış Cari": r.temp5_cmsort,
      Proje: r.temp5_xgrup,
      "Parça Kodu": r.temp5_xpart,
      "Ürün Grubu": r.temp5_urungrubu,
      "Ölçü Birimi": r.temp5_xUM,
      Miktar: r.temp5_xtop ?? 0,
      "Eskalasyonlu Birim Fiyat": r.temp5_eskbrfiyat ?? 0,
      "Satış Birim Fiyat": r.temp5_brfiyat ?? 0,
      Ciro: r.temp5_xgeneltop ?? 0,
      Malzeme: r.temp5_malzeme ?? 0,
      Iskarta: r.temp5_iskarta ?? 0,
      CSL: r.temp5_csl ?? 0,
      İşçilik: r.temp5_iscilik ?? 0,
      "Değişken Masraflar": "",
      "Ek Maliyet": r.temp5_ek ?? 0,
      Yönetim: r.temp5_yonetimToplam ?? 0,
      "Yönetim Tutarı": r.temp5_yonetimOran ?? 0,
      "Toplam Birim Maliyet": r.temp5_toplammaliyet ?? 0,
      "Toplam Malzeme": r.temp5_toplamMalzeme ?? 0,
      "Toplam Maliyet": r.temp5_toplammal ?? 0,
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
    XLSX.utils.book_append_sheet(wb, ws, "Satış Raporu");
    XLSX.writeFile(wb, `satisraporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid sx={{md: 3, xs: 12}}>
            <TextField
              label="Fatura Başlangıç"
              type="date"
              fullWidth
              value={fatdate}
              onChange={(e) => setFatdate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid sx={{md: 3, xs: 12}}>
            <TextField
              label="Fatura Bitiş"
              type="date"
              fullWidth
              value={fatdate1}
              onChange={(e) => setFatdate1(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid sx={{md: 3, xs: 12}}>
            <TextField
              label="İrs. Başlangıç"
              type="date"
              fullWidth
              value={gun}
              onChange={(e) => setGun(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid sx={{md: 3, xs: 12}}>
            <TextField
              label="İrs. Bitiş"
              type="date"
              fullWidth
              value={gun1}
              onChange={(e) => setGun1(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Yönetim Oranı */}
          <Grid sx={{md: 1, xs: 6, mt: 1}}>
            <TextField
              label="Yönetim Tutarı"
              type="number"
              fullWidth
              value={yonetimOran}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = (e.target as HTMLInputElement).valueAsNumber;
                setYonetimOran(Number.isNaN(v) ? 0 : v);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid  sx={{ mt: 1, md: 6, xs: 12 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" onClick={fetchData} disabled={loading}>
                Getir
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setRows([]);
                  setError(null);
                }}
              >
                Temizle
              </Button>
              <Button variant="outlined" onClick={downloadExcel} disabled={!rows.length}>
                Excel İndir
              </Button>
            </Box>
          </Grid>

          <Grid sx={{md: 3, xs: 12, mt: 1}}>
            <TextField
              label="Ara (Firma / Parça / Proje)"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>

          <Grid sx={{md: 3, xs: 12, mt: 1}}>
            <FormControl fullWidth>
              <InputLabel>Firma Filtre</InputLabel>
              <Select
                value={firmaFilter}
                label="Firma Filtre"
                onChange={(e) => setFirmaFilter(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {uniqueFirmalar.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

      {!loading && (
        <Paper elevation={2}>
          <Typography variant="body1" sx={{ p: 2, pb: 0 }}>
            Toplam kayıt: <strong>{filteredRows.length}</strong>
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Firma",
                    "Firma Adı",
                    "Proje",
                    "Parça Kodu",
                    "Ürün Grubu",
                    "Ölçü Birimi",
                    "Miktar",
                    "Eskalasyonlu Birim Fiyat",
                    "Satış Birim Fiyat",
                    "Ciro",
                    "Malzeme",
                    "Iskarta",
                    "CSL",
                    "Iscilik",
                    "Değişken Masraflar",
                    "Ek Maliyet",
                    "Yonetim",
                    "Yonetim Oran",
                    "Toplam Birim Maliyet",
                    "Toplam Malzeme",
                    "Toplam Maliyet",
                  ].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={24} align="center">
                      Gösterilecek kayıt yok.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.temp5_xfirma}</TableCell>
                      <TableCell>{r.temp5_cmsort}</TableCell>
                      <TableCell>{r.temp5_xgrup}</TableCell>
                      <TableCell>{r.temp5_xpart}</TableCell>
                      <TableCell>{r.temp5_urungrubu}</TableCell>
                      <TableCell>{r.temp5_xUM}</TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_xtop} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_eskbrfiyat} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_brfiyat} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_xgeneltop} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_malzeme} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_iskarta} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_csl} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_iscilik} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell /> {/* Değişken masraflar - veri yok */}
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_ek} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_yonetimToplam} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_yonetimOran} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_toplammaliyet} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_toplamMalzeme} />
                      </TableCell>
                      <TableCell align="right">
                        <DecimalCell value={r.temp5_toplammal} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Sayfa başına kayıt:"
          />
        </Paper>
      )}
    </Container>
  );
}
