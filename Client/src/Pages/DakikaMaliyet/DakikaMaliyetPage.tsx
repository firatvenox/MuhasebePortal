import React, { useState } from "react";
import * as XLSX from "xlsx";
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
  Button,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { environment } from "../../../Environments/Environment";

interface DakikaMaliyetItem {
  part: string;
  type: number;
  type1: string;
  tip: string;
  costCode: string;
  glCode: string;
  glDesc: string;
  costDesc: string;
  para: number;
}

const fetchData = async (
  tarih: string,
  tarih1: string
): Promise<DakikaMaliyetItem[]> => {
  const res = await fetch(
    environment.getApiUrl + `DakikaMaliyet?tarih=${tarih}&tarih1=${tarih1}`
  );
  return res.json();
};

const DakikaMaliyetPage: React.FC = () => {
  const [data, setData] = useState<DakikaMaliyetItem[]>([]);
  const [columns, setColumns] = useState<
    { costCode: string; costDesc: string; glType: string; label: string }[]
  >([]);
  const [tarih, setTarih] = useState<Dayjs | null>(dayjs("2025-07-01"));
  const [tarih1, setTarih1] = useState<Dayjs | null>(dayjs("2025-07-31"));
  const [loading, setLoading] = useState(false);

  // Excel'e aktar fonksiyonu
  const handleExportExcel = () => {
    if (data.length === 0) return;
    // Tabloyu düzleştir
    const exportRows: any[] = [];
    columns.forEach((col) => {
      data.forEach((row) => {
        exportRows.push({
          GL: row.glDesc,
          TIP: row.tip,
          CostCode: col.costCode,
          CostDesc: col.costDesc,
          GLType: col.glType,
          Label: col.label,
          Para: getCellAmount(row.glDesc, row.tip, col.costCode, col.glType),
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DakikaMaliyet");
    XLSX.writeFile(wb, `DakikaMaliyet_${tarih?.format("YYYYMMDD")}_${tarih1?.format("YYYYMMDD")}.xlsx`);
  };

  const handleFetch = async () => {
    if (!tarih || !tarih1) return;
    setLoading(true);

    const res = await fetchData(
      tarih.format("YYYY-MM-DD"),
      tarih1.format("YYYY-MM-DD")
    );

    const filtered = res.filter((d) => d.part && d.part.trim() !== "");
    setData(filtered);

    const uniqueCostCodes = Array.from(
      new Map(
        filtered.map((d) => [d.costCode, { costCode: d.costCode, costDesc: d.costDesc }])
      ).values()
    );

    const glTypes = ["72", "73", "75", "76", "77", "Diğer"];
    const newColumns: {
      costCode: string;
      costDesc: string;
      glType: string;
      label: string;
    }[] = [];

    uniqueCostCodes.forEach((col) => {
      glTypes.forEach((glType) => {
        const total = filtered
          .filter(
            (d) =>
              String(d.costCode) === String(col.costCode) &&
              (glType === "Diğer"
                ? !["72", "73", "75", "76", "77"].includes(d.glCode.substring(0, 2))
                : d.glCode.startsWith(glType))
          )
          .reduce((sum, d) => sum + d.para, 0);

        if (total > 0) {
          const typeLabel =
            glType === "72"
              ? "Direk"
              : glType === "73"
              ? "Endirek"
              : glType === "75"
              ? "AR-GE"
              : glType === "76"
              ? "Yönetim"
              : glType === "77"
              ? "Pazarlama"
              : "Diğer";

          newColumns.push({
            costCode: col.costCode,
            costDesc: col.costDesc,
            glType,
            label: typeLabel,
          });
        }
      });
    });

    setColumns(newColumns);
    setLoading(false);
  };
  
  const getCellAmount = (glDesc: string, tip: string, costCode: string, glType: string) => {
    return data
      .filter(
        (d) =>
          d.glDesc === glDesc &&
          d.tip === tip &&
          String(d.costCode) === String(costCode) &&
          (glType === "Diğer"
            ? !["72", "73", "75", "76", "77"].includes(d.glCode.substring(0, 2))
            : d.glCode.startsWith(glType))
      )
      .reduce((sum, d) => sum + d.para, 0);
  };

  const getTipTotal = (tip: string, costCode: string, glType: string) => {
    return data
      .filter(
        (d) =>
          d.tip === tip &&
          String(d.costCode) === String(costCode) &&
          (glType === "Diğer"
            ? !["72", "73", "75", "76", "77"].includes(d.glCode.substring(0, 2))
            : d.glCode.startsWith(glType))
      )
      .reduce((sum, d) => sum + d.para, 0);
  };

  const getRowTotal = (glDesc: string, tip: string) => {
    return columns.reduce(
      (sum, col) => sum + getCellAmount(glDesc, tip, col.costCode, col.glType),
      0
    );
  };

  const formatPara = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const groupedByTipAndType = data.reduce<Map<string, Map<number, DakikaMaliyetItem[]>>>(
    (acc, item) => {
      const { tip, type } = item;
      if (!acc.has(tip)) {
        acc.set(tip, new Map());
      }
      const typeMap = acc.get(tip)!;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)!.push(item);
      return acc;
    },
    new Map()
  );
  
  const getTipHeader = (tip: string) => {
    switch (tip) {
      case "Aylık Gelirler": return "AYLIK GELİRLER";
      case "Yardımcı Giderler": return "YARDIMCI GİDERLER";
      case "İşveren Giderleri": return "İŞVEREN GİDERLERİ";
      case "Tazminatlar": return "TAZMİNATLAR";
      default: return tip;
    }
  };

  const uniqueCostCodesForHeader = Array.from(
    new Map(
      columns.map((c) => [
        `${c.costCode}-${c.costDesc}`,
        { costCode: c.costCode, costDesc: c.costDesc },
      ])
    ).values()
  );
  
  const sortedTips = Array.from(groupedByTipAndType.keys());

  return (
    <div>
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Başlangıç Tarihi"
            value={tarih}
            onChange={(newValue) => setTarih(newValue)}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Bitiş Tarihi"
            value={tarih1}
            onChange={(newValue) => setTarih1(newValue)}
            slotProps={{ textField: { size: "small" } }}
          />
        </LocalizationProvider>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetch}
          disabled={loading}
        >
          Getir
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={handleExportExcel}
          disabled={data.length === 0}
        >
          Excel'e Aktar
        </Button>
        {loading && <CircularProgress size={24} />}
      </Box>

      {data.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2}>GL / TIP</TableCell>
                {uniqueCostCodesForHeader.map((costCode) => {
                  const colsForThisCost = columns.filter(
                    (c) => c.costCode === costCode.costCode
                  );
                  return (
                    <TableCell
                      key={`header-${costCode.costCode}`}
                      colSpan={colsForThisCost.length}
                      align="center"
                      style={{ fontWeight: "bold", backgroundColor: "#e0e0e0" }}
                    >
                      {costCode.costCode} {costCode.costDesc}
                    </TableCell>
                  );
                })}
                <TableCell rowSpan={2} align="right">
                  Satır Toplamı
                </TableCell>
              </TableRow>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell key={`subheader-${idx}`} align="right">
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTips.map((tip) => {
                const types = groupedByTipAndType.get(tip);
                if (!types) return null;
                
                const sortedTypes = Array.from(types.keys()).sort((a, b) => a - b);
                
                const firstType = types.keys().next().value;
                const isDetailedTip = firstType !== undefined && [1, 2, 3, 4].includes(firstType);

                return (
                  <React.Fragment key={`tip-${tip}`}>
                    {isDetailedTip && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 2}
                          style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                        >
                          {getTipHeader(tip)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {sortedTypes.map((type) => {
                      const group = types.get(type);
                      if (!group) return null;

                      if ([1, 2, 3, 4].includes(type)) {
                        const uniqueGlDescs = Array.from(new Set(group.map((d) => d.glDesc)));
                        return (
                          <React.Fragment key={`type-fragment-${tip}-${type}`}>
                            {uniqueGlDescs.map((glDesc) => (
                              <TableRow key={`row-${tip}-${type}-${glDesc}`}>
                                <TableCell>{glDesc}</TableCell>
                                {columns.map((col, idx) => (
                                  <TableCell
                                    key={`cell-${tip}-${type}-${glDesc}-${idx}`}
                                    align="right"
                                  >
                                    {formatPara(getCellAmount(glDesc, tip, col.costCode, col.glType))}
                                  </TableCell>
                                ))}
                                <TableCell align="right" style={{ fontWeight: "bold" }}>
                                  {formatPara(getRowTotal(glDesc, tip))}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell style={{ fontWeight: "bold" }}>
                                {getTipHeader(tip)}
                              </TableCell>
                              {columns.map((col, idx) => (
                                <TableCell
                                  key={`total-${tip}-${idx}`}
                                  align="right"
                                  style={{ fontWeight: "bold" }}
                                >
                                  {formatPara(getTipTotal(tip, col.costCode, col.glType))}
                                </TableCell>
                              ))}
                              <TableCell align="right" style={{ fontWeight: "bold" }}>
                                {formatPara(getTipTotal(tip, uniqueCostCodesForHeader[0].costCode, "Diğer"))}
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      } else {
                        return (
                          <TableRow key={`tip-total-row-${tip}-${type}`} style={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell style={{ fontWeight: "bold" }}>
                              {getTipHeader(tip)}
                            </TableCell>
                            {columns.map((col, idx) => (
                              <TableCell
                                key={`total-${tip}-${idx}`}
                                align="right"
                                style={{ fontWeight: "bold" }}
                              >
                                {formatPara(getTipTotal(tip, col.costCode, col.glType))}
                              </TableCell>
                            ))}
                            <TableCell align="right" style={{ fontWeight: "bold" }}>
                              {formatPara(getTipTotal(tip, uniqueCostCodesForHeader[0].costCode, "Diğer"))}
                            </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </React.Fragment>
              );
            })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default DakikaMaliyetPage;