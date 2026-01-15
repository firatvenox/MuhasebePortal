// ShelfPage.tsx – FIX: YENI BINA RENDER SORUNU ÇÖZÜLDÜ
import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
  memo,
  useMemo,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Instances,
  Instance,
  Html,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import * as XLSX from "xlsx";

import {
  Autocomplete,
  TextField,
  Tabs,
  Tab,
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
  Stack,
  Box,
  Typography,
} from "@mui/material";

import { environment } from "../../../Environments/Environment";
import "./ShelfPage.css";

/* -------------------------
   Types
   ------------------------- */
interface AmbarSecond {
  kasaAdi: string;
  parcaAdi: string;
  kasaAgirlik: number;
  kasaHacim: number;
}

interface ApiAmbar {
  ambarAdi: string;
  kapasite: number;
  varolanAgirlik: number;
  ambarHacim: number;
  ambarListe: AmbarSecond[];
}

interface KutuModel {
  id: string;
  agirlik: number;
  dolu: boolean;
  position: [number, number, number];
  ambarAdi: string;
  kapasite: number;
  ambarHacim: number;
  hacimDoluluk: number; // 0..1
  children: AmbarSecond[];
  containerInnerHeight: number;
  containerWidth: number;
  containerDepth: number;
  containerVolume: number;
}

/* -------------------------
   Helpers
   ------------------------- */
const BLOCK_LETTERS = "ABCDEFGHIJKL".split("").reverse();

// GÜVENLİ AYRIŞTIRICI: Tire, boşluk vb. temizler
function parseAmbarKod(kod: string) {
  // 1. Önce SVK/SVY prefixini at
  let clean = kod.replace(/^svk|^svy|^yma/i, "");
  // 2. Harf ve Rakam harici her şeyi (tire, boşluk) temizle
  clean = clean.replace(/[^a-zA-Z0-9]/g, "");

  const block = clean[0] || "A";
  const column = clean[1] || "A";

  // Slice ile sayı kısmını al, sayı değilse 1 dön
  const levelStr = clean.slice(2);
  const level = levelStr ? parseInt(levelStr) : 1;

  return { block, column, level: isNaN(level) ? 1 : level };
}

function charToIndex(char: string) {
  if (!char) return 0;
  // Eğer kolon rakam ise (örn: '1'), harf gibi işlememesi için kontrol
  if (/[0-9]/.test(char)) {
    return parseInt(char);
  }
  return char.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

function getDolulukColor(
  ratio: number,
  blockLetter?: string,
  isEmpty?: boolean,
  activeTab?: "SVK" | "SVY" | "YMA",
) {
  // SVK tab'da I bloğu: boşsa kırmızı
  if (activeTab === "SVK" && blockLetter?.toUpperCase() === "I" && isEmpty) {
    return "#ff5252"; // kırmızı
  }

  // Standart renk mantığı
  if (ratio > 0.8) return "#ff5252";
  if (ratio > 0.6) return "#ff9800";
  if (ratio > 0.3) return "#ffd54f";
  if (ratio > 0) return "#66bb6a";
  return "#90a4ae";
}

/* -------------------------
   CameraTargetController
   ------------------------- */
const CameraTargetController: React.FC<{ target: [number, number, number] }> =
  memo(({ target }) => {
    const controlRef = useRef<any>(null);

    useFrame(() => {
      if (!controlRef.current) return;
      const t = new THREE.Vector3(...target);
      controlRef.current.target.lerp(t, 0.08);
      controlRef.current.update();
    });

    return (
      <OrbitControls
        ref={controlRef}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.6}
        zoomSpeed={0.9}
        panSpeed={0.6}
        minDistance={0.5}
        maxDistance={500}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    );
  });

/* -------------------------
   Forklift (hafifletilmiş)
   ------------------------- */
const Forklift: React.FC<{ startX: number; z: number; color?: string }> = memo(
  ({ startX, z, color = "#ff9900" }) => {
    const ref = useRef<THREE.Group | null>(null);
    const tRef = useRef(0);

    useFrame((_, delta) => {
      tRef.current += delta * 0.6;
      if (ref.current) {
        ref.current.position.x = startX + Math.sin(tRef.current) * 30;
        ref.current.rotation.y = Math.sin(tRef.current * 0.7) * 0.1;
      }
    });

    return (
      <group position={[startX, 0.3, z]} ref={ref}>
        {/* Gövde */}
        <mesh>
          <boxGeometry args={[3, 1, 2]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Kabin */}
        <mesh position={[-0.8, 1, 0]}>
          <boxGeometry args={[1.6, 1.4, 2]} />
          <meshStandardMaterial color="#ffb74d" />
        </mesh>

        {/* Direk */}
        <mesh position={[1.4, 1.3, 0]}>
          <boxGeometry args={[0.2, 2.4, 1.4]} />
          <meshStandardMaterial
            color="#f5f5f5"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Çatallar */}
        <mesh position={[1.6, 0.25, 0.5]}>
          <boxGeometry args={[1.4, 0.1, 0.18]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
        <mesh position={[1.6, 0.25, -0.5]}>
          <boxGeometry args={[1.4, 0.1, 0.18]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
      </group>
    );
  },
);

/* -------------------------
   Main component
   ------------------------- */
const ShelfPage: React.FC = () => {
  const [kutular, setKutular] = useState<KutuModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState("");
  const [modalTab, setModalTab] = useState<"SVK" | "SVY" | "YMA">("SVK");

  const [filterBlock, setFilterBlock] = useState<string>("");
  const [filterKasa, setFilterKasa] = useState<string>("");
  const [filterParca, setFilterParca] = useState<string>("");

  const [selectedAmbar, setSelectedAmbar] = useState<KutuModel | null>(null);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
    0, 5, 0,
  ]);
  const [activeTab, setActiveTab] = useState<"SVK" | "SVY" | "YMA">("SVK");
  const [showTopPanel, setShowTopPanel] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState(true);

  const GROUP_SPACING = 20;
  const PAIR_SPACING = 8;
  const CONTAINER_WIDTH = 4.2;
  const CONTAINER_DEPTH = 6.5;
  const INNER_HEIGHT = 3;

  const [hoveredLabel, setHoveredLabel] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  // Data fetch
  useEffect(() => {
    fetch(environment.getApiUrl + "Ambar/hacim")
      .then((res) => res.json())
      .then((data: ApiAmbar[]) => {
        const kutuList: KutuModel[] = data.map((ambar, index) => {
          const { block, column, level } = parseAmbarKod(ambar.ambarAdi);

          const blockIndex = BLOCK_LETTERS.indexOf(block.toUpperCase());
          // Block index bulunamazsa (örn: "X") varsayılan 0 ata ki render patlamasın
          const safeBlockIndex = blockIndex === -1 ? 0 : blockIndex;

          const groupIndex = Math.floor(safeBlockIndex / 2);
          const pairIndex = safeBlockIndex % 2;

          const x = groupIndex * GROUP_SPACING + pairIndex * PAIR_SPACING;
          const z = charToIndex(column) * 10;
          const LEVEL_HEIGHT = 4.5;
          const y = LEVEL_HEIGHT * (level - 1) + INNER_HEIGHT / 2;

          // Hacim doluluk mantığı
          const ambarKod = ambar.ambarAdi.toUpperCase();
          let hacimDoluluk = 0;
          if (ambarKod.startsWith("I")) {
            // I BLOĞU
            // Eğer ağırlık 0 ise → I bloğu kırmızı (hacimDoluluk = 1 ama kırmızı gösterilecek)
            if ((ambar.varolanAgirlik ?? 0) === 0) {
              hacimDoluluk = 1;
              ambar.varolanAgirlik = 0; // boş ama kırmızı
            } 
            else {
              // Ağırlık > 0 ise normal hesap
              hacimDoluluk =
                ambar.kapasite > 0
                  ? (ambar.varolanAgirlik ?? 0) / ambar.kapasite
                  : 0;
            }
          }

          else if (ambarKod.startsWith("SVKH") || ambarKod.startsWith("SVKE")) {
            // SVKH / SVKE → A/B/C blokları ise sarı (0.33)
            const blokHarf = ambar.ambarAdi[4]?.toUpperCase();

            if (["A", "B", "C"].includes(blokHarf)) {
              hacimDoluluk = 0.33; // sarı
            } else {
              // normal hesap
              hacimDoluluk =
                ambar.kapasite > 0
                  ? (ambar.varolanAgirlik ?? 0) / ambar.kapasite
                  : 0;
            }
          }

          else {
            // DİĞER TÜM RAFLAR → NORMAL HESAP
            hacimDoluluk =
              ambar.kapasite > 0
                ? (ambar.varolanAgirlik ?? 0) / ambar.kapasite
                : 0;
          }


          const innerHeight = INNER_HEIGHT;
          const containerWidth = CONTAINER_WIDTH;
          const containerDepth = CONTAINER_DEPTH;
          const containerVolume = containerWidth * innerHeight * containerDepth;

          return {
            id: ambar.ambarAdi + index,
            agirlik: ambar.varolanAgirlik ?? 0,
            dolu: (ambar.varolanAgirlik ?? 0) > 0,
            position: [x, isNaN(y) ? 1.5 : y, isNaN(z) ? 0 : z], // NaN koruması
            ambarAdi: ambar.ambarAdi,
            kapasite: ambar.kapasite,
            ambarHacim: ambar.ambarHacim,
            hacimDoluluk,
            children: ambar.ambarListe ?? [],
            containerInnerHeight: innerHeight,
            containerWidth,
            containerDepth,
            containerVolume,
          } as KutuModel;
        });

        setKutular(kutuList);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Tab / filter logic - Memoize ederek performans arttırıyoruz
  const visibleKutular = useMemo(() => {
    return kutular.filter((k) => {
      // 1. Tab Filtresi (SVK / SVY / YMA)
      const matchesTab =
        activeTab === "SVK"
          ? k.ambarAdi.toUpperCase().startsWith("SVK")
          : activeTab === "SVY"
          ? k.ambarAdi.toUpperCase().startsWith("SVY")
          : k.ambarAdi.toUpperCase().startsWith("YMA");

      if (!matchesTab) return false;

      // 2. Blok Filtresi
      if (filterBlock) {
        if (parseAmbarKod(k.ambarAdi).block.toUpperCase() !== filterBlock)
          return false;
      }
      // 3. Kasa Filtresi
      if (filterKasa) {
        if (
          !k.children.some((c) =>
            c.kasaAdi.toLowerCase().includes(filterKasa.toLowerCase()),
          )
        )
          return false;
      }
      // 4. Parça Filtresi
      if (filterParca) {
        if (
          !k.children.some((c) =>
            c.parcaAdi.toLowerCase().includes(filterParca.toLowerCase()),
          )
        )
          return false;
      }
      return true;
    });
  }, [kutular, activeTab, filterBlock, filterKasa, filterParca]);

  // Kamera merkezi
  useEffect(() => {
    if (!visibleKutular.length) return;
    const xs = visibleKutular.map((k) => k.position[0]);
    const zs = visibleKutular.map((k) => k.position[2]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    setCameraTarget([centerX, 5, centerZ]);
  }, [visibleKutular.length, activeTab]); // Sadece length veya tab değişince tetikle

  const kasaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          visibleKutular.flatMap((k) => k.children.map((c) => c.kasaAdi)),
        ),
      ),
    [visibleKutular],
  );

  const parcaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          visibleKutular.flatMap((k) => k.children.map((c) => c.parcaAdi)),
        ),
      ),
    [visibleKutular],
  );

  const handleSelectKutu = (k: KutuModel) => {
    setSelectedAmbar(k);
    setCameraTarget([k.position[0], k.position[1] + 1.5, k.position[2]]);
    setShowTopPanel(true);
  };

const getBlockTotals = (type: "SVK" | "SVY" | "YMA") => {
  const filtered = kutular.filter((k) =>
    k.ambarAdi?.toUpperCase().startsWith(type),
  );

  let totalAgirlik = 0;
  let totalKapasite = 0;

  filtered.forEach((k) => {
    totalAgirlik += k.agirlik ?? 0;
    totalKapasite += k.kapasite ?? 0;
  });

  const oran =
    totalKapasite > 0 ? (totalAgirlik / totalKapasite) * 100 : 0;

  return {
    agirlik: totalAgirlik,
    kapasite: totalKapasite,
    oran,
  };
};


const getBlockReport = (type: "SVK" | "SVY" | "YMA") => {
  const filtered = kutular.filter((k) =>
    k.ambarAdi?.toUpperCase().startsWith(type),
  );

  const grouped: Record<
    string,
    { agirlik: number; kapasite: number; oran: number }
  > = {};

  filtered.forEach((k) => {
    const kod = k.ambarAdi.toUpperCase();

    // SVKA
    const blockCode =
      kod.length >= 4 ? kod.substring(0, 4) : kod.substring(0, 3);

    if (!grouped[blockCode]) {
      grouped[blockCode] = { agirlik: 0, kapasite: 0, oran: 0 };
    }

    grouped[blockCode].agirlik += k.agirlik ?? 0;
    grouped[blockCode].kapasite += k.kapasite ?? 0;
  });

  // oran hesapla
  Object.keys(grouped).forEach((b) => {
    const g = grouped[b];
    g.oran = g.kapasite > 0 ? (g.agirlik / g.kapasite) * 100 : 0;
  });

  return grouped;
};


  const outerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(circle at top, #1f2933 0%, #0b1015 55%, #050608 100%)",
    overflow: "hidden",
    fontFamily:
      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at top, #1e3c72 0%, #121212 60%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 64,
            letterSpacing: "0.35em",
            marginBottom: 20,
            opacity: 0.85,
          }}
        >
          YÜKLENİYOR{dots}
        </div>
        <div
          style={{
            width: 240,
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "45%",
              height: "100%",
              background: "linear-gradient(90deg, #4da6ff, #82c6ff)",
              borderRadius: 999,
              animation: "loadingBar 1.2s infinite",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      {/* Top Tabs */}
      <div
        style={{
          flex: "0 0 auto",
          background:
            "linear-gradient(120deg, #1e3c72 0%, #2a5298 40%, #111827 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setSelectedAmbar(null);
            setFilterBlock("");
            setFilterKasa("");
            setFilterParca("");
          }}
          centered
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.7)",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "16px 20px",
              transition: "all 0.3s ease",
              "&:hover": {
                color: "white",
                background: "rgba(255,255,255,0.04)",
              },
            },
            "& .Mui-selected": {
              color: "white",
              background: "rgba(15,23,42,0.6)",
              borderRadius: "10px 10px 0 0",
            },
            "& .MuiTabs-indicator": {
              height: 3,
              background: "linear-gradient(90deg, #4da6ff 0%, #82c6ff 100%)",
              borderRadius: "2px 2px 0 0",
            },
          }}
        >
          <Tab label="📦 Merkez Bina Sevkiyat" value="SVK" />
          <Tab label="🏢 Yeni Bina Sevkiyat" value="SVY" />
          <Tab label="🧪 Yarı Mamül Ambarı" value="YMA" />
        </Tabs>
      </div>

      <div
        style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}
      >
        {/* 3D + Filtre Paneli */}
        <div style={{ flex: "3 0 70%", minWidth: 700, position: "relative" }}>
          {/* Filter Panel */}
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              left: 16,
              top: 16,
              background: "rgba(15,23,42,0.95)",
              backdropFilter: "blur(18px)",
              padding: "20px 24px",
              borderRadius: 20,
              boxShadow: "0 20px 70px rgba(0,0,0,0.6)",
              minWidth: 320,
              color: "#e5e7eb",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 16,
                color: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🔍 Gelişmiş Filtreler
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Block Filter */}

            <Button
              size="small"
              variant="contained"
              onClick={() => {
                const workbook = XLSX.utils.book_new();

                // --- FONKSİYON: Bloklara göre grupla ("SVKA", "SVKB" vb.) ---
                const groupByBlock = (data: any[]) => {
                  const grouped: Record<
                    string,
                    { agirlik: number; kapasite: number }
                  > = {};

                  data.forEach((k) => {
                    const kod = k.ambarAdi.toUpperCase();

                    // SVK + 4. harf → SVKA
                    const blockCode =
                      kod.length >= 4 ? kod.substring(0, 4) : kod.substring(0, 3);

                    if (!grouped[blockCode]) {
                      grouped[blockCode] = { agirlik: 0, kapasite: 0 };
                    }

                    grouped[blockCode].agirlik += k.agirlik ?? 0;
                    grouped[blockCode].kapasite += k.kapasite ?? 0;
                  });

                  return grouped;
                };

                // -------------------------------
                // *** SVK ***
                // -------------------------------
                const svkData = kutular.filter((k) =>
                  k.ambarAdi?.toUpperCase().startsWith("SVK"),
                );

                const svkGrouped = groupByBlock(svkData);

                // Toplam hesapla
                const svkTotal = Object.values(svkGrouped).reduce(
                  (acc, g) => ({
                    agirlik: acc.agirlik + g.agirlik,
                    kapasite: acc.kapasite + g.kapasite,
                  }),
                  { agirlik: 0, kapasite: 0 },
                );

                const svkTotalDoluluk =
                  svkTotal.kapasite > 0
                    ? ((svkTotal.agirlik / svkTotal.kapasite) * 100).toFixed(2)
                    : "0.00";

                const svkRows = [
                  ["Ambar (Blok)", "Doluluk Oranı (%)", "Toplam Ağırlık (kg)", "Toplam Kapasite (kg)"],
                  ["🏭 Merkez Bina (Toplam)", svkTotalDoluluk, svkTotal.agirlik, svkTotal.kapasite],
                  [],
                  ...Object.keys(svkGrouped).map((blok) => {
                    const g = svkGrouped[blok];
                    const oran = g.kapasite > 0 ? ((g.agirlik / g.kapasite) * 100).toFixed(2) : "0.00";
                    return [blok, oran, g.agirlik, g.kapasite];
                  }),
                ];

                const svkSheet = XLSX.utils.aoa_to_sheet(svkRows);
                XLSX.utils.book_append_sheet(workbook, svkSheet, "SVK - Bloklar");

                // -------------------------------
                // *** SVY ***
                // -------------------------------
                const svyData = kutular.filter((k) =>
                  k.ambarAdi?.toUpperCase().startsWith("SVY"),
                );

                const svyGrouped = groupByBlock(svyData);

                const svyTotal = Object.values(svyGrouped).reduce(
                  (acc, g) => ({
                    agirlik: acc.agirlik + g.agirlik,
                    kapasite: acc.kapasite + g.kapasite,
                  }),
                  { agirlik: 0, kapasite: 0 },
                );

                const svyTotalDoluluk =
                  svyTotal.kapasite > 0
                    ? ((svyTotal.agirlik / svyTotal.kapasite) * 100).toFixed(2)
                    : "0.00";

                const svyRows = [
                  ["Ambar (Blok)", "Doluluk Oranı (%)", "Toplam Ağırlık (kg)", "Toplam Kapasite (kg)"],
                  ["🏢 Yeni Bina (Toplam)", svyTotalDoluluk, svyTotal.agirlik, svyTotal.kapasite],
                  [],
                  ...Object.keys(svyGrouped).map((blok) => {
                    const g = svyGrouped[blok];
                    const oran = g.kapasite > 0 ? ((g.agirlik / g.kapasite) * 100).toFixed(2) : "0.00";
                    return [blok, oran, g.agirlik, g.kapasite];
                  }),
                ];

                const svySheet = XLSX.utils.aoa_to_sheet(svyRows);
                XLSX.utils.book_append_sheet(workbook, svySheet, "SVY - Bloklar");

                // -------------------------------
                // *** YMA ***
                // -------------------------------
                const ymaData = kutular.filter((k) =>
                  k.ambarAdi?.toUpperCase().startsWith("YMA"),
                );

                const ymaGrouped = groupByBlock(ymaData);

                const ymaTotal = Object.values(ymaGrouped).reduce(
                  (acc, g) => ({
                    agirlik: acc.agirlik + g.agirlik,
                    kapasite: acc.kapasite + g.kapasite,
                  }),
                  { agirlik: 0, kapasite: 0 },
                );

                const ymaTotalDoluluk =
                  ymaTotal.kapasite > 0
                    ? ((ymaTotal.agirlik / ymaTotal.kapasite) * 100).toFixed(2)
                    : "0.00";

                const ymaRows = [
                  ["Ambar (Blok)", "Doluluk Oranı (%)", "Toplam Ağırlık (kg)", "Toplam Kapasite (kg)"],
                  ["🧪 Yarı Mamül (Toplam)", ymaTotalDoluluk, ymaTotal.agirlik, ymaTotal.kapasite],
                  [],
                  ...Object.keys(ymaGrouped).map((blok) => {
                    const g = ymaGrouped[blok];
                    const oran = g.kapasite > 0 ? ((g.agirlik / g.kapasite) * 100).toFixed(2) : "0.00";
                    return [blok, oran, g.agirlik, g.kapasite];
                  }),
                ];

                const ymaSheet = XLSX.utils.aoa_to_sheet(ymaRows);
                XLSX.utils.book_append_sheet(workbook, ymaSheet, "YMA - Bloklar");

                // -------------------------------
                // *** EXCEL KAYDET ***
                // -------------------------------
                XLSX.writeFile(
                  workbook,
                  `Sevkiyat_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`,
                );
              }}
              sx={{
                bgcolor: "#10b981",
                color: "#fff",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "11px",
                padding: "6px 10px",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              📥 Excel
            </Button>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    marginBottom: 8,
                    color: "#9ca3af",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Blok
                </label>
                <select
                  value={filterBlock}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.7)",
                    outline: "none",
                    fontSize: 13,
                    background: "rgba(15,23,42,0.9)",
                    color: "#e5e7eb",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onChange={(e) => setFilterBlock(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {BLOCK_LETTERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kasa Autocomplete */}
              <Autocomplete
                options={kasaOptions}
                value={filterKasa}
                onInputChange={(_, v) => setFilterKasa(v)}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="🎯 Kasa Ara"
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "rgba(15,23,42,0.9)",
                        color: "#e5e7eb",
                        "& fieldset": {
                          borderColor: "rgba(148,163,184,0.7)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#60a5fa",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                          borderWidth: 1.5,
                        },
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "13px",
                      },
                      "& .MuiInputLabel-root": {
                        color: "#9ca3af",
                        fontSize: "12px",
                      },
                    }}
                  />
                )}
              />

              {/* Parça Autocomplete */}
              <Autocomplete
                options={parcaOptions}
                value={filterParca}
                onInputChange={(_, v) => setFilterParca(v)}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="🔧 Parça Ara"
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "rgba(15,23,42,0.9)",
                        color: "#e5e7eb",
                        "& fieldset": {
                          borderColor: "rgba(148,163,184,0.7)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#60a5fa",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                          borderWidth: 1.5,
                        },
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "13px",
                      },
                      "& .MuiInputLabel-root": {
                        color: "#9ca3af",
                        fontSize: "12px",
                      },
                    }}
                  />
                )}
              />

                {(filterBlock || filterKasa || filterParca) && (
                <div
                  style={{
                    padding: "9px 10px",
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(236,72,153,0.12) 100%)",
                    borderRadius: 10,
                    border: "1px solid rgba(96,165,250,0.6)",
                    fontSize: 11,
                    color: "#e5e7eb",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  ✓ {visibleKutular.length} sonuç
                </div>
              )}

              {/* Excel ve Rapor Butonları */}
              <div style={{ display: "flex", gap: 10, width: "100%" }}>

                <Button
                  size="small"
                  variant="contained"
                  fullWidth
                  onClick={() => setModalOpen(true)}
                  sx={{
                    bgcolor: "#3b82f6",
                    color: "#fff",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "12px",
                    padding: "10px 16px",
                    "&:hover": { bgcolor: "#2563eb" },
                  }}
                >
                  👁️ Rapor Görüntüle
                </Button>
              </div>
            </div>
          </div>          {/* Renk Göstergesi (Legend) */}
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              left: 16,
              bottom: 16,
              background: "rgba(15,23,42,0.95)",
              backdropFilter: "blur(18px)",
              padding: "16px 20px",
              borderRadius: 16,
              boxShadow: "0 20px 70px rgba(0,0,0,0.6)",
              color: "#e5e7eb",
              border: "1px solid rgba(148,163,184,0.4)",
              minWidth: 280,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🎨 Renk Göstergesi
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#ff5252",
                    borderRadius: 6,
                    border: "1px solid rgba(255,82,82,0.8)",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  %80 üzeri dolu / I Bloğu boş
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#ff9800",
                    borderRadius: 6,
                    border: "1px solid rgba(255,152,0,0.8)",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  %60-%80 dolu
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#ffd54f",
                    borderRadius: 6,
                    border: "1px solid rgba(255,213,79,0.8)",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  %30-%60 dolu
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#66bb6a",
                    borderRadius: 6,
                    border: "1px solid rgba(102,187,106,0.8)",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  %0-%30 dolu
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#90a4ae",
                    borderRadius: 6,
                    border: "1px solid rgba(144,164,174,0.8)",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  Boş / Bilgi Yok
                </span>
              </div>
            </div>
          </div>

          {/* 3D Canvas */}
          <Canvas
            shadows={false}
            dpr={[1, 1.3]}
            camera={{ position: [0, 35, 70], fov: 55, near: 0.01, far: 2000 }}
          >
            <color attach="background" args={["#050a10"]} />

            <ambientLight intensity={0.35} />
            <directionalLight position={[70, 80, 40]} intensity={0.9} />

            <CameraTargetController target={cameraTarget} />

            <Suspense fallback={null}>
              {/* Zemin */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.15, 0]}
                receiveShadow
              >
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial
                  roughness={0.8}
                  metalness={0.1}
                  color="#0b1120"
                />
              </mesh>

              {/* Hafif gölge efekti */}
              <ContactShadows
                position={[0, -0.16, 0]}
                opacity={0.35}
                width={200}
                height={200}
                blur={2.5}
                far={30}
              />

              {/* Grid */}
              <gridHelper args={[300, 24, "#374151", "#1f2933"]} />

              {/* Forklift */}
              <Forklift startX={35} z={-12} />

              {/* INSTANCED KUTU RENDER 
                  CRITICAL FIX: key={activeTab} eklenerek tab değişiminde 
                  buffer'ın temizlenip yeniden dolması sağlanır.
              */}
              <Instances
                key={activeTab + visibleKutular.length}
                limit={visibleKutular.length || 1}
              >
                <boxGeometry
                  args={[CONTAINER_WIDTH, INNER_HEIGHT, CONTAINER_DEPTH]}
                />
                <meshStandardMaterial roughness={0.45} metalness={0.15} />

                {visibleKutular.map((k) => {
                  const selected = selectedAmbar && selectedAmbar.id === k.id;
                  const blockLetter = parseAmbarKod(k.ambarAdi).block;
                  const isEmpty = k.agirlik === 0;
                  const baseColor = getDolulukColor(
                    k.hacimDoluluk,
                    blockLetter,
                    isEmpty,
                    activeTab,
                  );
                  const color = selected ? "#ffffff" : baseColor;

                  return (
                    <Instance
                      key={k.id}
                      position={k.position}
                      scale={selected ? [1.04, 1.04, 1.04] : [1, 1, 1]}
                      color={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectKutu(k);
                      }}
                      onPointerOver={(e) => {
                        e.stopPropagation();
                        const firstParca = k.children[0]?.parcaAdi;
                        const firstKasa = k.children[0]?.kasaAdi;
                        setHoveredLabel({
                          text:
                            `${k.ambarAdi}` +
                            (firstKasa
                              ? `\n${firstKasa}${firstParca ? ` – ${firstParca}` : ""}`
                              : ""),
                          x: (e as any).clientX,
                          y: (e as any).clientY,
                        });
                      }}
                      onPointerOut={(e) => {
                        e.stopPropagation();
                        setHoveredLabel(null);
                      }}
                    />
                  );
                })}
              </Instances>

              {/* Blok harfleri */}
              {BLOCK_LETTERS.map((b) => {
                const blok = visibleKutular.filter(
                  (k) => parseAmbarKod(k.ambarAdi).block.toUpperCase() === b,
                );
                if (!blok.length) return null;
                const front = blok.reduce((p, c) =>
                  c.position[2] < p.position[2] ? c : p,
                );
                return (
                  <Html
                    key={b}
                    position={[
                      front.position[0],
                      front.position[1] + 6,
                      front.position[2] - 5,
                    ]}
                    center
                    style={{
                      color: "#f97316",
                      fontWeight: 800,
                      fontSize: "18px",
                      textShadow: "0 0 10px rgba(0,0,0,0.9)",
                    }}
                  >
                    {b}
                  </Html>
                );
              })}
            </Suspense>
          </Canvas>

          {/* Hover Tooltip */}
          {hoveredLabel && (
            <div
              style={{
                position: "fixed",
                left: hoveredLabel.x + 12,
                top: hoveredLabel.y + 12,
                pointerEvents: "none",
                background: "rgba(15,23,42,0.96)",
                color: "#e5e7eb",
                padding: "8px 10px",
                borderRadius: 8,
                zIndex: 50,
                fontSize: 11,
                whiteSpace: "pre-line",
                border: "1px solid rgba(148,163,184,0.7)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              }}
            >
              {hoveredLabel.text}
            </div>
          )}
        </div>

                  {modalOpen && (
                    <Dialog
                      open={modalOpen}
                      onClose={() => setModalOpen(false)}
                      maxWidth="md"
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
                          color: "#60a5fa",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(148,163,184,0.2)",
                        }}
                      >
                        📊 Blok Bazlı Sevkiyat Raporu
                      </DialogTitle>

                      <DialogContent sx={{ padding: "24px" }}>
                        <Stack direction="row" gap={2} sx={{ mb: 3 }}>
                          <Button
                            variant={modalTab === "SVK" ? "contained" : "outlined"}
                            onClick={() => setModalTab("SVK")}
                            sx={{
                              bgcolor: modalTab === "SVK" ? "#3b82f6" : "transparent",
                              color: "#fff",
                              borderColor: "#3b82f6",
                            }}
                          >
                            🏭 Merkez Bina (SVK)
                          </Button>

                          <Button
                            variant={modalTab === "SVY" ? "contained" : "outlined"}
                            onClick={() => setModalTab("SVY")}
                            sx={{
                              bgcolor: modalTab === "SVY" ? "#8b5cf6" : "transparent",
                              color: "#fff",
                              borderColor: "#8b5cf6",
                            }}
                          >
                            🏢 Yeni Bina (SVY)
                          </Button>

                          <Button
                            variant={modalTab === "YMA" ? "contained" : "outlined"}
                            onClick={() => setModalTab("YMA")}
                            sx={{
                              bgcolor: modalTab === "YMA" ? "#10b981" : "transparent",
                              color: "#fff",
                              borderColor: "#10b981",
                            }}
                          >
                            🧪 Yarı Mamül
                          </Button>
                        </Stack>

                        {/* BLOK RAPORU */}
                        <TableContainer
                          component={Paper}
                          sx={{
                            bgcolor: "rgba(15,23,42,0.8)",
                            border: "1px solid rgba(148,163,184,0.3)",
                            borderRadius: "12px",
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "rgba(59,130,246,0.15)" }}>
                                <TableCell sx={{ color: "#60a5fa", fontWeight: 700 }}>Blok</TableCell>
                                <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700 }}>
                                  Ağırlık (kg)
                                </TableCell>
                                <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700 }}>
                                  Kapasite (kg)
                                </TableCell>
                                <TableCell align="right" sx={{ color: "#60a5fa", fontWeight: 700 }}>
                                  Doluluk %
                                </TableCell>
                              </TableRow>
                            </TableHead>

                            <TableBody>
                              {Object.entries(
                                modalTab === "SVK"
                                  ? getBlockReport("SVK")
                                  : modalTab === "SVY"
                                  ? getBlockReport("SVY")
                                  : getBlockReport("YMA"),
                              ).map(([block, g]) => {
                                const color =
                                  g.oran > 80
                                    ? "#ff5252"
                                    : g.oran > 60
                                      ? "#ff9800"
                                      : g.oran > 30
                                        ? "#ffd54f"
                                        : "#66bb6a";

                                return (
                                  <TableRow key={block}>
                                    <TableCell sx={{ color: "#e5e7eb", fontWeight: 600 }}>
                                      {block}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: "#9ca3af" }}>
                                      {g.agirlik.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: "#9ca3af" }}>
                                      {g.kapasite.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{ color, fontWeight: 700 }}
                                    >
                                      {g.oran.toFixed(2)}%
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                          {/* DIP TOPLAM ALANI */}
                        <Box
                          sx={{
                            mt: 3,
                            p: 2,
                            bgcolor: "rgba(148,163,184,0.05)",
                            borderRadius: "12px",
                            border: "1px solid rgba(148,163,184,0.2)",
                          }}
                        >
                          {(() => {
                            const t =
                              modalTab === "SVK"
                                ? getBlockTotals("SVK")
                                : modalTab === "SVY"
                                ? getBlockTotals("SVY")
                                : getBlockTotals("YMA");

                            return (
                              <>
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    mb: 1,
                                    color: modalTab === "SVK" ? "#3b82f6" : modalTab === "SVY" ? "#8b5cf6" : "#10b981",
                                  }}
                                >
                                  {modalTab === "SVK"
                                    ? "🏭 Merkez Bina - Dip Toplam"
                                    : modalTab === "SVY"
                                    ? "🏢 Yeni Bina - Dip Toplam"
                                    : "🧪 Yarı Mamül - Dip Toplam"}
                                </Typography>

                                <Stack direction="row" justifyContent="space-between" sx={{ color: "#e5e7eb" }}>
                                  <Typography sx={{ fontSize: 13 }}>
                                    <strong>Toplam Ağırlık:</strong>{" "}
                                    {t.agirlik.toLocaleString("tr-TR")} kg
                                  </Typography>

                                  <Typography sx={{ fontSize: 13 }}>
                                    <strong>Toplam Kapasite:</strong>{" "}
                                    {t.kapasite.toLocaleString("tr-TR")} kg
                                  </Typography>

                                  <Typography
                                    sx={{
                                      fontSize: 13,
                                      color:
                                        t.oran > 80
                                          ? "#ff5252"
                                          : t.oran > 60
                                            ? "#ff9800"
                                            : t.oran > 30
                                              ? "#ffd54f"
                                              : "#66bb6a",
                                      fontWeight: 700,
                                    }}
                                  >
                                    <strong>Doluluk:</strong> {t.oran.toFixed(2)}%
                                  </Typography>
                                </Stack>
                              </>
                            );
                          })()}
                        </Box>

                        </TableContainer>
                      </DialogContent>

                      <DialogActions>
                        <Button
                          onClick={() => setModalOpen(false)}
                          sx={{ color: "#60a5fa", fontWeight: 600 }}
                        >
                          Kapat
                        </Button>
                      </DialogActions>
                    </Dialog>
                  )}


        {/* Sağ Detay Panel */}
        {showTopPanel && selectedAmbar && (
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 8,
              width: 420,
              maxHeight: "85vh",
              background: "rgba(15,23,42,0.98)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
              borderRadius: 18,
              zIndex: 200,
              border: "1px solid rgba(148,163,184,0.6)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(14,116,144,0.3) 40%, rgba(15,23,42,0.95) 100%)",
                borderRadius: "18px 18px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(148,163,184,0.4)",
                padding: "8px 12px",
                gap: 8,
              }}
            >
              <button
                onClick={() => setDetailExpanded(!detailExpanded)}
                style={{
                  padding: "10px 12px",
                  border: "none",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderBottom: detailExpanded
                    ? "3px solid #60a5fa"
                    : "3px solid transparent",
                }}
              >
                {detailExpanded ? "▼" : "▶"} Detay
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              
              <button
                onClick={() => setShowTopPanel(false)}
                style={{
                  padding: "8px 10px",
                  border: "none",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
              </div>
            </div>

            {detailExpanded && (
              <div
                style={{
                  overflowY: "auto",
                  padding: "20px 22px",
                  flex: 1,
                  color: "#e5e7eb",
                }}
              >
                {/* Başlık */}
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>📦</span>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {selectedAmbar.ambarAdi}
                    </h2>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                    }}
                  >
                    Raf detayları & kasa bilgileri
                  </div>
                </div>

                <div
                  style={{
                    height: 2,
                    background:
                      "linear-gradient(90deg, rgba(148,163,184,0) 0%, rgba(148,163,184,0.7) 45%, rgba(148,163,184,0) 100%)",
                    marginBottom: 18,
                  }}
                />

                {/* Info Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      background:
                        "radial-gradient(circle at top left, rgba(59,130,246,0.25), rgba(15,23,42,0.9))",
                      borderRadius: 14,
                      border: "1px solid rgba(59,130,246,0.6)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#93c5fd",
                        marginBottom: 4,
                      }}
                    >
                      KAPASİTE
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, color: "white" }}
                    >
                      {selectedAmbar.kapasite} kg
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background:
                        "radial-gradient(circle at top left, rgba(16,185,129,0.2), rgba(15,23,42,0.9))",
                      borderRadius: 14,
                      border: "1px solid rgba(16,185,129,0.5)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6ee7b7",
                        marginBottom: 4,
                      }}
                    >
                      MEVCUT YÜK
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, color: "white" }}
                    >
                      {selectedAmbar.agirlik} kg
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background:
                        "radial-gradient(circle at top left, rgba(245,158,11,0.2), rgba(15,23,42,0.9))",
                      borderRadius: 14,
                      border: "1px solid rgba(245,158,11,0.5)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#fbbf24",
                        marginBottom: 4,
                      }}
                    >
                      DOLULUK ORANI
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, color: "white" }}
                    >
                      {selectedAmbar.kapasite > 0
                        ? (
                            (selectedAmbar.agirlik / selectedAmbar.kapasite) *
                            100
                          ).toFixed(2)
                        : "0.00"}
                      %
                    </div>
                  </div>
                </div>

                {/* Kasa Listesi */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 10,
                      color: "#e5e7eb",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    İçerik ({selectedAmbar.children.length})
                  </div>

                  {selectedAmbar.children.length === 0 ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        fontSize: 13,
                        color: "#6b7280",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 12,
                        border: "1px dashed rgba(255,255,255,0.1)",
                      }}
                    >
                      Bu rafta kayıtlı kasa bulunamadı.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {selectedAmbar.children.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            border: "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "background 0.2s",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#60a5fa",
                                fontWeight: 600,
                                fontSize: 13,
                                marginBottom: 2,
                              }}
                            >
                              {c.kasaAdi}
                            </div>
                            {c.parcaAdi && (
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                {c.parcaAdi}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>
                              {c.kasaAgirlik} kg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelfPage;
