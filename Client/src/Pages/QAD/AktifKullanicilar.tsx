import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  Grid
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { environment } from "../../../Environments/Environment";

/* =======================
   ENTITY
======================= */
interface UserLockEntity {
  usrID: number;
  usrName: string;
  usrIP: string;
  qadProgram: string;
  lockTable: string;
  lockFlags: string; // Görseldeki 'S', 'X' gibi flaglar buraya gelecek
  sirket: string;
  lockDetail?: string;
}
const API_URL = environment.getApiUrl;
const REFRESH_INTERVAL = 30_000;

export default function AktifKullanicilarPage() {
  const [data, setData] = useState<UserLockEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* =======================
      DATA FETCH
  ======================= */
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}UserLock/active-locks`);
      const list: UserLockEntity[] = Array.isArray(res.data) ? res.data : [];
      setData(list);
    } catch (error) {
      console.error("Aktif kullanıcılar alınamadı", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

    const handleKill = async (usrID: number, sirket: string) => {
    if (window.confirm(`${usrID} nolu kullanıcının bağlantısını kesmek istediğinize emin misiniz?`)) {
        try {
            sirket = sirket || "Ermetal"; // sirket boşsa default olarak ermetal ata
        await axios.post(`${API_URL}UserLock/disconnect`, { usrID, sirket });
        alert("Kullanıcı kovuldu!");
        fetchData(); // Listeyi yenile
        } catch (err) {
        alert("Hata oluştu!");
        }
    }
    };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  /* =======================
      FILTER & KPI CALC
  ======================= */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = search.toLowerCase();
      return (
        item.usrName?.toLowerCase().includes(searchStr) ||
        item.usrIP?.toLowerCase().includes(searchStr) ||
        item.lockTable?.toLowerCase().includes(searchStr) ||
        item.qadProgram?.toLowerCase().includes(searchStr) ||
        item.sirket?.toLowerCase().includes(searchStr)
      );
    });
  }, [data, search]);

  const lockCount = useMemo(() => {
    return data.filter(x => x.lockTable && x.lockTable !== "").length;
  }, [data]);

  /* =======================
      COLUMNS
  ======================= */
const columns: GridColDef[] = [
  { field: "usrID", headerName: "PID", flex: 0.7 },
  { field: "usrName", headerName: "Kullanıcı", flex: 1.1 },
  { field: "usrIP", headerName: "Terminal", flex: 0.9 },
  { field: "qadProgram", headerName: "Ekran", flex: 1 },
  { 
    field: "lockTable", 
    headerName: "Tablo", 
    flex: 1.2,
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontWeight: params.value ? 'bold' : 'normal' }}>
        {params.value || "-"}
      </Typography>
    )
  },
    {
    field: "lockFlags",
    headerName: "Flag",
    width: 80,
    renderCell: (params) => {
      const flag = params.value?.toUpperCase() || "";
      const isX = flag.includes("X    Q H"); 
      const isS = flag.startsWith("S");

      return flag ? (
        <Chip
          label={flag} 
          size="small"
          sx={{ 
            bgcolor: isX ? 'error.main' : isS ? 'warning.main' : 'info.main', 
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 1
          }}
        />
      ) : "-";
    }
  },
    {
    field: "actions",
    headerName: "İşlem",
    width: 150,
    renderCell: (params) => (
        <button 
        onClick={() => handleKill(params.row.usrID, params.row.sirket)}
        style={{ color: 'red', cursor: 'pointer', border: '1px solid red', borderRadius: '4px', background: 'white' }}
        >
        KULLANICIYI AT
        </button>
    )
  },
  {
    field: "lockStatus",
    headerName: "Durum",
    flex: 1.2,
    valueGetter: (_params, row) => {
        const flag = row.lockFlags?.toUpperCase() || "";
        
        if (!row.lockTable || flag === "") return "BOŞTA";
        
        // S ile başlıyorsa meşgul
        if (flag.startsWith("S")) return "MEŞGUL";
        
        // X ile başlıyorsa çakışma
        if (flag.startsWith("X")) return "ÇAKIŞMA";
        
        // Diğer kilit türleri (U, L vb.) için genel işlem durumu
        return "İŞLENİYOR";
    },
    renderCell: (params) => {
      const status = params.value;
      let chipProps: any = { color: "success", variant: "outlined" };

      if (status === "ÇAKIŞMA") {
        chipProps = { color: "error", variant: "filled" };
      } else if (status === "MEŞGUL") {
        chipProps = { color: "warning", variant: "filled" };
      } else if (status === "İŞLENİYOR") {
        chipProps = { color: "info", variant: "filled" };
      }

      return (
        <Chip
          label={status}
          {...chipProps}
          size="small"
          sx={{ fontWeight: 'bold', minWidth: '100px' }}
        />
      );
    }
  }
];
  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3} color="primary">
        QAD Real-Time Monitor
      </Typography>

      {/* ================= KPI + SEARCH ================= */}
      <Grid container spacing={2} mb={3}>
        <Grid sx={{xs: 12, md:3}}>
          <Card sx={{ borderRadius: 3, bgcolor: lockCount > 0 ? '#fff5f5' : '#fff' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Aktif Çakışma Sayısı
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={lockCount > 0 ? "error.main" : "success.main"}>
                {lockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{xs: 12, md:9}}>
          <TextField
            fullWidth
            variant="outlined"
            label="Kullanıcı, IP, Tablo veya Şirket Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
        </Grid>
      </Grid>

      {/* ================= TABLE ================= */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={10}>
              <CircularProgress size={40} />
              <Typography mt={2} color="text.secondary">Veriler AppServer'dan çekiliyor...</Typography>
            </Box>
          ) : (
            <DataGrid
              rows={filteredData.map((x, i) => ({ id: `${x.sirket}-${x.usrID}-${i}`, ...x }))}
              columns={columns}
              autoHeight
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
              }}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}