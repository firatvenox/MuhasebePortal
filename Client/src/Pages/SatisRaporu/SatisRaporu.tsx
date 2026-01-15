import * as XLSX from "xlsx"; // en üstte ekle
import { useState } from "react";
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
  Menu,
  MenuItem,
  TableFooter,
  Tabs,
  Tab
} from "@mui/material";
import { environment } from "../../../Environments/Environment";
import React from "react";

type SatisRaporu = {
  temp5_xfirma: string;
  temp5_xpart: string;
  temp5_cmsort: string;
  temp5_xgrup: string;
  temp5_xUM: string;
  temp5_xtop: number;
  temp5_brfiyat: number;
  temp5_eskbrfiyat: number;
  temp5_iskarta: number;
  temp5_iskartaToplam: number;
  temp5_malzeme: number;
  temp5_xgeneltop: number;
  temp5_xlistfiy: number;
  temp5_xlistcurr: string;
  temp5_iscilik: number;
  temp5_ek: number;
  temp5_fason: number;
  temp5_toplammaliyet: number;
  temp5_toplamMalzeme: number;
  temp5_toplammal: number;
  temp5_amortisman1: number;
  temp5_amortisman2: number;
  temp5_yonetimToplam: number;
  degisken2: number;
  sabit2: number;
  temp5_agirlik: number;
  temp5_hurda: number;
  temp5_grup: string;
  temp5_afirma: string;
  temp5_yfirma: string;
};

// Helper component: decimal değerleri 2 ondalık ve tooltip ile göster
const DecimalCell = ({ value }: { value?: number }) => {
  return (
    <span>
      {value !== undefined && value !== null
        ? value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
        : "-"}
    </span>
  );
};


export default function SatisRaporuMaliyetliPage() {
const [activeTab, setActiveTab] = useState<"detay" | "ozet">("detay");

  const [fatdate, setFatdate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fatdate1, setFatdate1] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [gun, setGun] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [gun1, setGun1] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amortisman, setAmortisman] = useState<number>(0);
  const [iskartaOran, setIskartaOran] = useState<number>(0);
  const [yonetimOran, setYonetimOran] = useState<number>(0);
  const [degiskenOran, setDegiskenOran] = useState<number>(0);
  const [sabitOran, setSabitOran] = useState<number>(0);

  const [rows, setRows] = useState<SatisRaporu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const handleClose = () => setContextMenu(null);
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
        amortisman: amortisman.toString(),
        iskartaOran: iskartaOran.toString(),
        yonetimOran: yonetimOran.toString(),
        degiskenOran: degiskenOran.toString(),
        sabitOran: sabitOran.toString(),
      });

      const res = await fetch(environment.getApiUrl + `Muhasebe/SatisRaporuMaliyetli?${qs.toString()}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = (await res.json()) as SatisRaporu[];
      setRows(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!rows.length) return;
    const header = Object.keys(rows[0]);
    const csv = [
      header.join(","),
      ...rows.map(r => header.map(h => {
        const v = (r as any)[h];
        if (v === null || v === undefined) return "";
        const s = v.toString().replace(/"/g, '""');
        return /[,"]/u.test(s) ? `"${s}"` : s;
      }).join(","))
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satisraporu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

    function downloadExcel() {
      if (!rows.length) return;

      // Ekrandaki başlıklarla eşleştirilecek mapping
      const mappedData = rows.map(r => ({
        "Firma": r.temp5_xfirma,
        "Firma Adı": r.temp5_cmsort,
        "Firma Grup": r.temp5_afirma,
        "Çatı": r.temp5_yfirma,
        "Grup": r.temp5_grup,
        "Parça Kodu": r.temp5_xpart,
        "Proje": r.temp5_xgrup,
        "Ölçü Birimi": r.temp5_xUM,
        "Miktar": r.temp5_xtop,
        "Satış Birim Fiyat": r.temp5_brfiyat,
        "Eskalasyonlu Birim Fiyat": r.temp5_eskbrfiyat,
        "Net Ağırlık": r.temp5_agirlik,
        "Brüt Ağırlık": r.temp5_hurda,
        "Ciro": r.temp5_xgeneltop,
        "Liste Fiyatı": r.temp5_xlistfiy,
        "Döviz Cinsi": r.temp5_xlistcurr,
        "Malzeme": r.temp5_malzeme,
        "Malzeme Toplam": r.temp5_malzeme * r.temp5_xtop,
        "Fason Giderleri": r.temp5_fason,
        "Fason Toplam": r.temp5_fason * r.temp5_xtop,
        "Iskarta": r.temp5_iskarta,
        "Iskarta Toplam": r.temp5_iskarta * r.temp5_xtop,
        "İşçilik": r.temp5_iscilik,
        "Ek Maliyet": r.temp5_ek,
        "Değişken": r.degisken2,
        "Sabit": r.sabit2,
        "Yönetim": r.temp5_yonetimToplam,
        "Toplam Birim Maliyet": r.temp5_toplammaliyet,
        "Toplam Malzeme": r.temp5_toplamMalzeme,
        "Toplam Maliyet": r.temp5_toplammal,
        "Amortisman": r.temp5_amortisman2,
      }));

      // JSON -> Worksheet
      const ws = XLSX.utils.json_to_sheet(mappedData);

      // Kolon genişliklerini ayarla
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

      // Workbook oluştur
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Satış Raporu");

      // İndir
      XLSX.writeFile(wb, `satisraporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    // önce totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.malzeme += r.temp5_malzeme || 0;
        acc.fason += r.temp5_fason || 0;
        acc.iscilik += r.temp5_iscilik || 0;
        acc.ek += r.temp5_ek || 0;
        acc.genel += r.temp5_xgeneltop || 0;
        acc.toplamMaliyet += r.temp5_toplammaliyet || 0;
        acc.toplamMalzeme += r.temp5_toplamMalzeme || 0;
        acc.iskartaToplam += r.temp5_iskarta || 0;
        acc.malzemeToplam += r.temp5_malzeme * r.temp5_xtop || 0;
        acc.fasonToplam += r.temp5_fason * r.temp5_xtop || 0;
        acc.iskartaToplamToplam += acc.iskartaToplam || 0;
        return acc;
      },
      { malzeme: 0, fason: 0, iscilik: 0, ek: 0, genel: 0, toplamMaliyet: 0, toplamMalzeme: 0, iskartaToplam: 0, malzemeToplam: 0, fasonToplam: 0, iskartaToplamToplam: 0 }
    );

   // Önce totals
  const toplamlar = rows.reduce(
    (acc, r) => {
      acc.genel += r.temp5_xgeneltop || 0;
      return acc;
    },
    { genel: 0 }
  );

  const genelCiro = toplamlar.genel || 1;

  // Afirma -> Yfirma gruplaması
  const grouped: Record<string, any> = {};

  rows.forEach(r => {
    const yfirmaKey = r.temp5_yfirma || "Diğer";
    const afirmaKey = r.temp5_afirma || "Diğer";

    if (!grouped[yfirmaKey]) {
      grouped[yfirmaKey] = {
        yfirma: yfirmaKey,
        toplamCiro: 0,
        toplamMaliyet: 0,
        malzeme: 0,
        iscilik: 0,
        fason: 0,
        ek: 0,
        afirmalar: {} as Record<string, any>
      };
    }

    // Yfirma toplamları
    grouped[yfirmaKey].toplamCiro += r.temp5_xgeneltop || 0;
    grouped[yfirmaKey].toplamMaliyet += r.temp5_toplammaliyet || 0;
    grouped[yfirmaKey].malzeme += r.temp5_malzeme || 0;
    grouped[yfirmaKey].iscilik += r.temp5_iscilik || 0;
    grouped[yfirmaKey].fason += r.temp5_fason || 0;
    grouped[yfirmaKey].ek += r.temp5_ek || 0;

    // Afirma alt grupları
    if (!grouped[yfirmaKey].afirmalar[afirmaKey]) {
      grouped[yfirmaKey].afirmalar[afirmaKey] = {
        afirma: afirmaKey,
        toplamCiro: 0,
        toplamMaliyet: 0,
        malzeme: 0,
        iscilik: 0,
        fason: 0,
        ek: 0
      };
    }

    grouped[yfirmaKey].afirmalar[afirmaKey].toplamCiro += r.temp5_xgeneltop || 0;
    grouped[yfirmaKey].afirmalar[afirmaKey].toplamMaliyet += r.temp5_toplammaliyet || 0;
    grouped[yfirmaKey].afirmalar[afirmaKey].malzeme += r.temp5_malzeme || 0;
    grouped[yfirmaKey].afirmalar[afirmaKey].iscilik += r.temp5_iscilik || 0;
    grouped[yfirmaKey].afirmalar[afirmaKey].fason += r.temp5_fason || 0;
    grouped[yfirmaKey].afirmalar[afirmaKey].ek += r.temp5_ek || 0;
  });

  // Object.values ile array haline getir
  const groupedByYfirma = Object.values(grouped);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Satış Raporu (Maliyetli)
      </Typography>

      {/* Sekmeler */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Detay" value="detay" />
          <Tab label="Özet" value="ozet" />
        </Tabs>
      </Paper>

      {activeTab === "detay" && (
        <Box>
          <Container maxWidth="xl" sx={{ mt: 2 }}>
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Grid container spacing={2} alignItems="flex-end">
                {/* Tarih ve oran inputları */}
                <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
                  <TextField
                    label="Fatura Başlangıç"
                    type="date"
                    fullWidth
                    value={fatdate}
                    onChange={e => setFatdate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
                  <TextField
                    label="Fatura Bitiş"
                    type="date"
                    fullWidth
                    value={fatdate1}
                    onChange={e => setFatdate1(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
                  <TextField
                    label="İrs. Başlangıç"
                    type="date"
                    fullWidth
                    value={gun}
                    onChange={e => setGun(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid sx={{ sm: 6, md: 3, xs: 12 }}>
                  <TextField
                    label="İrs. Bitiş"
                    type="date"
                    fullWidth
                    value={gun1}
                    onChange={e => setGun1(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid sx={{ sm: 4, md: 2, xs: 12 }}>
                  <TextField
                    label="Amortisman"
                    type="number"
                    fullWidth
                    value={amortisman}
                    onChange={e => setAmortisman(Number(e.target.value))}
                  />
                </Grid>
                <Grid sx={{ sm: 4, md: 2, xs: 12 }}>
                  <TextField
                    label="İskarta Oran"
                    type="number"
                    fullWidth
                    value={iskartaOran}
                    onChange={e => setIskartaOran(Number(e.target.value))}
                  />
                </Grid>
                <Grid sx={{ sm: 4, md: 2, xs: 12 }}>
                  <TextField
                    label="Yönetim Oran"
                    type="number"
                    fullWidth
                    value={yonetimOran}
                    onChange={e => setYonetimOran(Number(e.target.value))}
                  />
                </Grid>
                <Grid sx={{ sm: 4, md: 2, xs: 12 }}>
                  <TextField
                    label="Değişken Oran"
                    type="number"
                    fullWidth
                    value={degiskenOran}
                    onChange={e => setDegiskenOran(Number(e.target.value))}
                  />
                </Grid>
                          <Grid sx={{ sm: 4, md: 2, xs: 12 }}>
                  <TextField
                    label="Sabit Oran"
                    type="number"
                    fullWidth
                    value={sabitOran}
                    onChange={e => setSabitOran(Number(e.target.value))}
                  />
                </Grid>
                <Grid sx={{ md: 6, xs: 12 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" onClick={fetchData} disabled={loading}>
                      Getir
                    </Button>
                    <Button variant="outlined" onClick={() => { setRows([]); setError(null); }}>
                      Temizle
                    </Button>
                    <Button variant="outlined" onClick={downloadCsv} disabled={!rows.length}>
                      CSV İndir
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
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && (
              <Paper elevation={2}>
                <Typography variant="body1" sx={{ p: 2, pb: 0 }}>
                  Toplam kayıt: <strong>{rows.length}</strong>
                </Typography>
                <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Firma", "Firma Adı", "Firma Grup", "Çatı", "Grup", "Parça Kodu", "Proje", "Ölçü Birimi", "Miktar", 
                        "Satış Birim Fiyat", "Eskalasyonlu Birim Fiyat", "Net Ağırlık", "Brüt Ağırlık", "Ciro",
                        "Liste Fiyatı", "Döviz Cinsi", "Malzeme", "Malzeme Toplam",
                        "Fason Giderleri", "Fason Toplam", "Iskarta", "Iskarta Toplam", 
                        "Iscilik", "Ek Maliyet", "Değişken", "Sabit", "Yonetim", "Toplam Birim Maliyet", 
                        "Toplam Malzeme", "Toplam Maliyet", "Amortisman"
                      ].map((h) => (
                        <TableCell
                          key={h}
                          sx={{ 
                            whiteSpace: "nowrap", 
                            minWidth: 120,   // her sütunun en az genişliği
                            fontWeight: "bold"
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={24} align="center">Gösterilecek kayıt yok.</TableCell>
                      </TableRow>
                    ) : (
                      rows.map((r, i) => (
                        <TableRow key={i} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                          <TableCell>{r.temp5_xfirma}</TableCell>               {/* Firma */}
                          <TableCell>{r.temp5_cmsort}</TableCell>               {/* Firma Adı */}
                          <TableCell>{r.temp5_afirma}</TableCell>               {/* Firma Adı */}
                          <TableCell>{r.temp5_yfirma}</TableCell>               {/* Çatı Adı */}
                          <TableCell>{r.temp5_grup}</TableCell>               {/* Firma Adı */}
                          <TableCell>{r.temp5_xpart}</TableCell>                {/* Parça Kodu */}
                          <TableCell>{r.temp5_xgrup}</TableCell>                {/* Proje/Grup */}
                          <TableCell>{r.temp5_xUM}</TableCell>                  {/* Ölçü Birimi */}
                          <TableCell align="right"><DecimalCell value={r.temp5_xtop} /></TableCell> {/* Miktar */}
                          <TableCell align="right"><DecimalCell value={r.temp5_brfiyat} /></TableCell> {/* Satış Birim Fiyat */}
                          <TableCell align="right"><DecimalCell value={r.temp5_eskbrfiyat} /></TableCell> {/* Eskalasyonlu Fiyat */}
                          <TableCell align="right"><DecimalCell value={r.temp5_agirlik} /></TableCell> {/* Net  Ağırlık */}
                          <TableCell align="right"><DecimalCell value={r.temp5_hurda} /></TableCell> {/* Brüt Ağırlık */}
                          <TableCell align="right"><DecimalCell value={r.temp5_xgeneltop} /></TableCell> {/* Ciro (Genel Toplam) */}
                          <TableCell align="right"><DecimalCell value={r.temp5_xlistfiy} /></TableCell> {/* Liste Fiyatı */}
                          <TableCell>{r.temp5_xlistcurr}</TableCell>            {/* Döviz Cinsi */}
                          <TableCell align="right"><DecimalCell value={r.temp5_malzeme} /></TableCell> {/* Malzeme */}
                          <TableCell align="right"><DecimalCell value={r.temp5_malzeme * r.temp5_xtop} /></TableCell> {/* Malzeme Toplam */}
                          <TableCell align="right"><DecimalCell value={r.temp5_fason} /></TableCell>   {/* Fason Giderleri */}
                          <TableCell align="right"><DecimalCell value={r.temp5_fason * r.temp5_xtop} /></TableCell> {/* Fason Toplam */}
                          <TableCell align="right"><DecimalCell value={r.temp5_iskarta} /></TableCell> {/* Iskarta */}
                          <TableCell align="right"><DecimalCell value={r.temp5_iskarta * r.temp5_xtop} /></TableCell> {/* Iskarta Toplam */}
                          <TableCell align="right"><DecimalCell value={r.temp5_iscilik} /></TableCell> {/* Iscilik */}
                          <TableCell align="right"><DecimalCell value={r.temp5_ek} /></TableCell>       {/* Ek Maliyet */}
                          <TableCell align="right"><DecimalCell value={r.degisken2} /></TableCell>       {/* Değişken */}
                          <TableCell align="right"><DecimalCell value={r.sabit2} /></TableCell>       {/* Sabit */}
                          <TableCell align="right"><DecimalCell value={r.temp5_yonetimToplam} /></TableCell> {/* Yonetim */}
                          <TableCell align="right"><DecimalCell value={r.temp5_toplammaliyet} /></TableCell> {/* Toplam Birim Maliyet */}
                          <TableCell align="right"><DecimalCell value={r.temp5_toplamMalzeme} /></TableCell> {/* Toplam Malzeme */}
                          <TableCell align="right"><DecimalCell value={r.temp5_toplammal} /></TableCell> {/* Toplam Maliyet */}
                          <TableCell align="right"><DecimalCell value={r.temp5_amortisman2} /></TableCell> {/* Amortisman */}
                        </TableRow>
                      ))
                    )}
                  </TableBody>

                  {rows.length > 0 && (
                    <TableFooter>
                      <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                        <TableCell colSpan={5} align="right"><strong>TOPLAM</strong></TableCell>
                        <TableCell /> {/* Miktar */}
                        <TableCell /> {/* Satış Birim Fiyat */}
                        <TableCell /> {/* Eskalasyonlu Birim Fiyat */}
                        <TableCell align="right"><DecimalCell value={totals.genel} /></TableCell> {/* Ciro (Genel Toplam) */}
                        <TableCell /> {/* Liste Fiyatı */}
                        <TableCell /> {/* Döviz Cinsi */}
                        <TableCell align="right"><DecimalCell value={totals.malzeme} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.malzemeToplam} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.fason} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.fasonToplam} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.iskartaToplam} /></TableCell>
                        <TableCell /> {/* Iskarta Toplam ayrı hesaplama gerekiyorsa buraya */}
                        <TableCell align="right"><DecimalCell value={totals.iscilik} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.ek} /></TableCell>
                        <TableCell /> {/* Yönetim */}
                        <TableCell align="right"><DecimalCell value={totals.toplamMaliyet} /></TableCell>
                        <TableCell align="right"><DecimalCell value={totals.toplamMalzeme} /></TableCell>
                        <TableCell /> {/* Toplam Maliyet */}
                        <TableCell /> {/* Amortisman */}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </TableContainer>

              </Paper>
            )}

            <Menu
              open={contextMenu !== null}
              onClose={handleClose}
              anchorReference="anchorPosition"
              anchorPosition={
                contextMenu !== null
                  ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                  : undefined
              }
            >
              <MenuItem onClick={handleClose}>Grup Oluştur</MenuItem>
              <MenuItem onClick={handleClose}>Grupları Görüntüle</MenuItem>
            </Menu>
          </Container>
        </Box>
      )}
      {activeTab === "ozet" && (
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Çatı Bazlı Özet</Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Çatı</b></TableCell>
                  <TableCell align="right"><b>Toplam Ciro</b></TableCell>
                  <TableCell align="right"><b>% Pay</b></TableCell>
                  <TableCell align="right"><b>Toplam Maliyet</b></TableCell>
                  <TableCell align="right"><b>Malzeme</b></TableCell>
                  <TableCell align="right"><b>İşçilik</b></TableCell>
                  <TableCell align="right"><b>Fason</b></TableCell>
                  <TableCell align="right"><b>Ek Maliyet</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedByYfirma.map((y: any, i: number) => (
                  <React.Fragment key={i}>
                    {Object.values(y.afirmalar).map((a: any, j: number) => (
                      <TableRow key={j}>
                        <TableCell sx={{ pl: 4 }}>{a.afirma}</TableCell>
                        <TableCell align="right">{a.toplamCiro.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell /> {/* % Pay boş bırakılabilir */}
                        <TableCell align="right">{a.toplamMaliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{a.malzeme.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{a.iscilik.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{a.fason.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{a.ek.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                    {/* Çatı satırı */}
                    <TableRow sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
                      <TableCell>{y.yfirma}</TableCell>
                      <TableCell align="right">{y.toplamCiro.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{((y.toplamCiro / genelCiro) * 100).toFixed(2)}%</TableCell>
                      <TableCell align="right">{y.toplamMaliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{y.malzeme.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{y.iscilik.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{y.fason.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{y.ek.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                    {/* Afirma alt satırları */}
                    
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

    </Container>
  );
}