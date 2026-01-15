import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Collapse,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { environment } from "../../../Environments/Environment";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CiroEntity {
  cariNo: string;
  musName: string;
  toplamDov: number;
  aySonu: string;
  sirket: string;
}

interface ExpandedRowState {
  [key: string]: boolean;
}

interface SortConfig {
  key: keyof CiroEntity | "ay";
  direction: "ascending" | "descending";
}

const CiroRaporuPage: React.FC = () => {
  const [data, setData] = useState<CiroEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<ExpandedRowState>({});
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  useEffect(() => {
    fetch(environment.getApiUrl + "CiroRaporu/get-ciroraporu")
      .then((res) => res.json())
      .then((veri) => {
        setData(veri);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Hatası:", err);
        setLoading(false);
      });
  }, []);

  const handleRowExpand = (monthKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const requestSort = (key: keyof CiroEntity | "ay") => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof CiroEntity | "ay") => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <ArrowDownwardIcon fontSize="small" />
    );
  };

  const filteredData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "ay") {
          aValue = new Date(a.aySonu).getTime();
          bValue = new Date(b.aySonu).getTime();
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData.filter((row) => {
      const monthKey = new Date(row.aySonu).toLocaleString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      const companyMatch = selectedCompany ? row.sirket === selectedCompany : true;
      const customerMatch = selectedCustomer
        ? row.musName.toLowerCase().includes(selectedCustomer.toLowerCase())
        : true;
      const monthMatch = selectedMonth ? monthKey === selectedMonth : true;
      return companyMatch && customerMatch && monthMatch;
    });
  }, [data, selectedCompany, selectedCustomer, selectedMonth, sortConfig]);

  const allCompanies = useMemo(() => {
    return Array.from(new Set(data.map((row) => row.sirket)));
  }, [data]);

  const allMonths = useMemo(() => {
    const months = Array.from(
      new Set(
        data.map((row) =>
          new Date(row.aySonu).toLocaleString("tr-TR", {
            year: "numeric",
            month: "long",
          })
        )
      )
    ).sort((a, b) => {
      const [, aYear] = a.split(" ");
      const [, bYear] = b.split(" ");
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return new Date(a).getMonth() - new Date(b).getMonth();
    });
    return months;
  }, [data]);

  const chartData = useMemo(() => {
    const datasets = allCompanies.map((company) => {
      const companyData = allMonths.map((month) => {
        const total = filteredData
          .filter(
            (row) =>
              row.sirket === company &&
              new Date(row.aySonu).toLocaleString("tr-TR", {
                year: "numeric",
                month: "long",
              }) === month
          )
          .reduce((sum, row) => sum + row.toplamDov, 0);
        return total;
      });

      // Dinamik renk ataması
      const colorMap = {
        "Sirket a": "rgba(255, 99, 132, 0.6)",
        "Plasmot": "rgba(54, 162, 235, 0.6)",
        "Ermetal": "rgba(255, 206, 86, 0.6)",
        "Ergida": "rgba(75, 192, 192, 0.6)",
      };

      return {
        label: company,
        data: companyData,
        backgroundColor: colorMap[company as keyof typeof colorMap] || "rgba(153, 102, 255, 0.6)",
        borderColor: colorMap[company as keyof typeof colorMap] ? colorMap[company as keyof typeof colorMap].replace("0.6", "1") : "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      };
    });

    return {
      labels: allMonths,
      datasets: datasets,
    };
  }, [allCompanies, allMonths, filteredData]);

  const formattedTableData = useMemo(() => {
    const groupedByMonth: { [key: string]: CiroEntity[] } = {};
    filteredData.forEach((row) => {
      const monthKey = new Date(row.aySonu).toLocaleString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      groupedByMonth[monthKey].push(row);
    });
    return groupedByMonth;
  }, [filteredData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Aylık Ciro Raporu (Şirket Bazlı)
      </Typography>
      <Box mb={4} p={2} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: true,
                text: "Şirketlerin Aylık Ciro Performansı",
              },
            },
            scales: {
              x: {
                stacked: true,
                title: {
                  display: true,
                  text: "Aylar",
                },
              },
              y: {
                stacked: true,
                title: {
                  display: true,
                  text: "Toplam Ciro (Döviz)",
                },
              },
            },
          }}
        />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid sx={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Şirket Filtresi</InputLabel>
            <Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value as string)}
              label="Şirket Filtresi"
            >
              <MenuItem value="">Tüm Şirketler</MenuItem>
              {allCompanies.map((company) => (
                <MenuItem key={company} value={company}>
                  {company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid sx={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Ay Filtresi</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value as string)}
              label="Ay Filtresi"
            >
              <MenuItem value="">Tüm Aylar</MenuItem>
              {allMonths.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid sx={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Müşteri Filtresi"
            variant="outlined"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 3 }}>
        <Table aria-label="collapsible table">
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell />
              <TableCell
                sx={{ fontWeight: "bold", cursor: "pointer" }}
                onClick={() => requestSort("ay")}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  Ay {getSortIcon("ay")}
                </Box>
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", cursor: "pointer" }}
                onClick={() => requestSort("toplamDov")}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  Toplam Döviz {getSortIcon("toplamDov")}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(formattedTableData).map(([monthKey, monthData]) => {
              const totalMonthCiro = monthData.reduce(
                (sum, row) => sum + row.toplamDov,
                0
              );
              const isExpanded = expandedRows[monthKey];
              return (
                <React.Fragment key={monthKey}>
                  <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
                    <TableCell>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => handleRowExpand(monthKey)}
                      >
                        {isExpanded ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {monthKey}
                    </TableCell>
                    <TableCell>
                      {totalMonthCiro.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                          <Typography variant="h6" gutterBottom component="div">
                            Müşteri Detayları
                          </Typography>
                          <Table size="small" aria-label="purchases">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "#fafafa" }}>
                                <TableCell
                                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                                  onClick={() => requestSort("sirket")}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    Şirket {getSortIcon("sirket")}
                                  </Box>
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                                  onClick={() => requestSort("cariNo")}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    Cari No {getSortIcon("cariNo")}
                                  </Box>
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                                  onClick={() => requestSort("musName")}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    Müşteri Adı {getSortIcon("musName")}
                                  </Box>
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                                  onClick={() => requestSort("toplamDov")}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                    Toplam Döviz {getSortIcon("toplamDov")}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {monthData.map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell>{row.sirket}</TableCell>
                                  <TableCell>{row.cariNo}</TableCell>
                                  <TableCell>{row.musName}</TableCell>
                                  <TableCell align="right">
                                    {row.toplamDov.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CiroRaporuPage;