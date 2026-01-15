// ShelfPage.tsx - OPTIMIZED
import React, { useEffect, useState, useRef, Suspense, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Text, ContactShadows } from "@react-three/drei";
import "./ShelfPage.css";

import {
  Autocomplete,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { environment } from "../../../Environments/Environment";

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
  containerInnerHeight?: number;
  containerWidth?: number;
  containerDepth?: number;
  containerVolume?: number;
}

/* -------------------------
   Helpers & Caching
   ------------------------- */
function parseAmbarKod(kod: string) {
  const clean = kod.replace(/^svk|^svy/i, "");
  const block = clean[0];
  const column = clean[1];
  const level = parseInt(clean.slice(2));
  return { block, column, level };
}

function charToIndex(char: string) {
  return char.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

// OPTIMIZATION: Raycaster & Mouse caching (reuse same objects)
const raycasterRef = new THREE.Raycaster();
const mouseRef = new THREE.Vector2();

/* -------------------------
   CameraTargetController - OPTIMIZED
   - Only lerp when target changes
   - Better dampingFactor
   ------------------------- */
const CameraTargetController: React.FC<{ target: [number, number, number] }> = ({ target }) => {
  const controlRef = useRef<any>(null);
  const prevTargetRef = useRef<[number, number, number]>([0, 2, 0]);

  useFrame(() => {
    if (!controlRef.current) return;
    
    // Only update if target actually changed (avoids unnecessary lerp)
    if (
      prevTargetRef.current[0] !== target[0] ||
      prevTargetRef.current[1] !== target[1] ||
      prevTargetRef.current[2] !== target[2]
    ) {
      controlRef.current.target.lerp(
        new THREE.Vector3(target[0], target[1], target[2]),
        0.08
      );
      prevTargetRef.current = [...target];
    }
    controlRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.9}
      panSpeed={0.6}
      minDistance={6}
      maxDistance={300}
      autoRotate={false}
    />
  );
};

interface WheelProps {
  position: [number, number, number];
}

const Wheel: React.FC<WheelProps> = ({ position }) => (
  <mesh position={position} castShadow receiveShadow>
    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
    <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
  </mesh>
);

const Forklift: React.FC<{ startX: number; z: number; color?: string }> = ({
  startX,
  z,
  color = "#ff9900",
}) => {
  const ref = useRef<THREE.Group | null>(null);
  const lightRef = useRef<THREE.SpotLight | null>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    if (ref.current) {
      ref.current.position.x = startX + Math.sin(tRef.current * 0.25) * 60;
      ref.current.rotation.y = Math.sin(tRef.current * 0.5) * 0.05;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.9 + Math.sin(tRef.current * 6) * 0.3;
    }
  });

  return (
    <group position={[startX, 0.3, z]} ref={ref} castShadow>
      {/* Body */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.5, 2]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Cabin */}
      <mesh position={[-1.2, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 2]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Seat */}
      <mesh position={[-1.2, 1.25, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 1]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-1.2, 0.3, 0.8]} />
      <Wheel position={[-1.2, 0.3, -0.8]} />
      <Wheel position={[1, 0.3, 0.8]} />
      <Wheel position={[1, 0.3, -0.8]} />

      {/* Mast */}
      <mesh position={[1.5, 1.3, 0]} castShadow>
        <boxGeometry args={[0.2, 2.5, 1.5]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Forks */}
      <mesh position={[1.7, 0.2, 0.4]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.15]} />
        <meshStandardMaterial color="#aaaaaa" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[1.7, 0.2, -0.4]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.15]} />
        <meshStandardMaterial color="#aaaaaa" metalness={1} roughness={0.1} />
      </mesh>

      {/* Lights */}
      <spotLight
        ref={lightRef}
        position={[1.5, 1.5, 0]}
        angle={0.7}
        penumbra={0.5}
        distance={20}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        color={"#fff7e6"}
        intensity={0.5}
      />
    </group>
  );
};

const Kutu: React.FC<{
  kutu: KutuModel;
  onSelect: (k: KutuModel) => void;
  isSelected: boolean;
}> = ({ kutu, onSelect, isSelected }) => {
  const meshRef = useRef<any>(null);

  const doluluk = kutu.kapasite > 0 ? kutu.agirlik / kutu.kapasite : 0;
  
  // OPTIMIZATION: useMemo to avoid recalculating color each render
  const mainColor = useMemo(() => {
    if (doluluk > 0.8) return "#c0392b";
    if (doluluk > 0.6) return "#e74c3c";
    if (doluluk > 0.45) return "#e67e22";
    if (doluluk > 0.25) return "#f1c40f";
    if (doluluk > 0) return "#2ecc71";
    return "#b5f5b5";
  }, [doluluk]);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.015;
      meshRef.current.scale.set(s, s, s);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  const width = kutu.containerWidth ?? 3.2;
  const depth = kutu.containerDepth ?? 5;
  const innerHeight = kutu.containerInnerHeight ?? 2.0;

  return (
    <group position={kutu.position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        userData={{ kutuId: kutu.id }}
        onClick={() => onSelect(kutu)}
        aria-label={`Ambar ${kutu.ambarAdi}`}
      >
        <boxGeometry args={[width, innerHeight + 0.2, depth]} />
        <meshStandardMaterial
          color={isSelected ? "white" : mainColor}
          transparent
          opacity={0.85}
          roughness={0.45}
          metalness={0.12}
        />
      </mesh>

      <Text
        position={[0, (innerHeight + 0.2) / 2 + 0.6, 0]}
        fontSize={0.55}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineColor="black"
        outlineWidth={0.045}
        rotation={[0, Math.PI, 0]}
      >
        {kutu.agirlik.toFixed(1)} kg
      </Text>

      {kutu.children.length > 0 && (
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width - 0.6, innerHeight * 0.9, depth - 1]} />
          <meshStandardMaterial color="#4da6ff" opacity={0.9} transparent />
        </mesh>
      )}
    </group>
  );
};

/* -------------------------
   Main component - OPTIMIZED
   - Better error handling
   - Memoized filters
   - Optimized raycaster
   - Right panel with details
   - Accessibility improvements
   ------------------------- */
const ShelfPage: React.FC = () => {
  const [kutular, setKutular] = useState<KutuModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterBlock, setFilterBlock] = useState<string>("");
  const [filterKasa, setFilterKasa] = useState<string>("");
  const [filterParca, setFilterParca] = useState<string>("");

  const [selectedAmbar, setSelectedAmbar] = useState<KutuModel | null>(null);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 2, 0]);
  const [activeTab, setActiveTab] = useState<"SVK" | "SVY">("SVK");
  const [dots, setDots] = useState("");
  const [showTopPanel, setShowTopPanel] = useState(false);

  const GROUP_SPACING = 20;
  const PAIR_SPACING = 8;
  const CONTAINER_WIDTH = 4.2;
  const CONTAINER_DEPTH = 6.5;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // OPTIMIZATION: Better error handling for API
  useEffect(() => {
    setError(null);
    fetch(environment.getApiUrl + "Ambar/hacim")
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: ApiAmbar[]) => {
        const kutuList: KutuModel[] = data.map((ambar, index) => {
          const { block, column, level } = parseAmbarKod(ambar.ambarAdi);

          const blockIndex = charToIndex(block);
          const groupIndex = Math.floor(blockIndex / 2);
          const pairIndex = blockIndex % 2;

          const x = groupIndex * GROUP_SPACING + pairIndex * PAIR_SPACING;
          const z = charToIndex(column) * 10;

          const innerHeight = 3;
          const fullHeight = 3.2;
          const LEVEL_HEIGHT = 4.5;
          const y = LEVEL_HEIGHT * (level - 1) + fullHeight / 2;

          const containerWidth = CONTAINER_WIDTH;
          const containerDepth = CONTAINER_DEPTH;
          const containerVolume = containerWidth * innerHeight * containerDepth;

          const toplamKasaHacmi = (ambar.ambarListe ?? []).reduce(
            (acc, c) => acc + (c.kasaHacim ?? 0),
            0
          );

          const hacimDoluluk =
            ambar.ambarHacim > 0 ? toplamKasaHacmi / ambar.ambarHacim : 0;

          return {
            id: ambar.ambarAdi + index,
            agirlik: ambar.varolanAgirlik ?? 0,
            dolu: (ambar.varolanAgirlik ?? 0) > 0,
            position: [x, y, z] as [number, number, number],
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
        setError("Veri yükleme hatası. Lütfen sayfayı yenileyin.");
        setLoading(false);
      });
  }, []);

  // OPTIMIZATION: Memoized filters to avoid unnecessary recalculations
  const tabFiltered = useMemo(
    () =>
      kutular.filter((k) =>
        activeTab === "SVK"
          ? k.ambarAdi.toUpperCase().startsWith("SVK")
          : k.ambarAdi.toUpperCase().startsWith("SVY")
      ),
    [kutular, activeTab]
  );

  const visibleKutular = useMemo(() => {
    return tabFiltered.filter((k) => {
      if (filterBlock && parseAmbarKod(k.ambarAdi).block.toUpperCase() !== filterBlock)
        return false;
      if (
        filterKasa &&
        !k.children.some((c) => c.kasaAdi.toLowerCase().includes(filterKasa.toLowerCase()))
      )
        return false;
      if (
        filterParca &&
        !k.children.some((c) => c.parcaAdi.toLowerCase().includes(filterParca.toLowerCase()))
      )
        return false;
      return true;
    });
  }, [tabFiltered, filterBlock, filterKasa, filterParca]);

  useEffect(() => {
    if (!visibleKutular.length) return;
    const xs = visibleKutular.map((k) => k.position[0]);
    const zs = visibleKutular.map((k) => k.position[2]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    setCameraTarget([centerX, 2, centerZ]);
  }, [visibleKutular]);

  // OPTIMIZATION: Memoized options for autocomplete
  const kasaOptions = useMemo(
    () => Array.from(new Set(tabFiltered.flatMap((k) => k.children.map((c) => c.kasaAdi)))),
    [tabFiltered]
  );

  const parcaOptions = useMemo(
    () => Array.from(new Set(tabFiltered.flatMap((k) => k.children.map((c) => c.parcaAdi)))),
    [tabFiltered]
  );

  const outerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "#111",
    overflow: "hidden",
  };

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
        role="status"
        aria-label="Loading warehouse data"
      >
        <CircularProgress sx={{ mb: 2 }} />
        <div className="nabla" style={{ fontSize: 120, color: "gray" }}>
          YÜKLENİYOR{dots}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }} role="alert">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  // OPTIMIZATION: useCallback for selector to avoid recreating every render
  const KutuSelector: React.FC<{
    kutular: KutuModel[];
    setSelectedAmbar: (k: KutuModel) => void;
    setCameraTarget: (t: [number, number, number]) => void;
    setShowTopPanel: (b: boolean) => void;
  }> = useCallback(
    ({ kutular, setSelectedAmbar, setCameraTarget, setShowTopPanel }) => {
      const { scene, camera, gl } = useThree();

      const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
          event.stopPropagation();

          mouseRef.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.y = -(event.clientY / window.innerHeight) * 2 + 1;

          // OPTIMIZATION: Use cached raycaster, only search direct children (not recursive)
          raycasterRef.setFromCamera(mouseRef, camera);
          const intersects = raycasterRef.intersectObjects(scene.children, false);

          if (intersects.length > 0) {
            const first = intersects.find((i) => i.object.userData.kutuId);
            if (first) {
              const kutu = kutular.find((k) => k.id === first.object.userData.kutuId);
              if (kutu) {
                setSelectedAmbar(kutu);
                setCameraTarget([kutu.position[0], kutu.position[1] + 1.5, kutu.position[2]]);
                setShowTopPanel(true);
              }
            }
          }
        },
        [scene, camera, kutular, setSelectedAmbar, setCameraTarget, setShowTopPanel]
      );

      return <primitive object={gl.domElement} onPointerDown={handlePointerDown} />;
    },
    []
  );

  return (
    <div style={outerStyle}>
      <div style={{ flex: "0 0 auto" }}>
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
          style={{ background: "#f5f5f5", borderBottom: "1px solid #ccc" }}
        >
          <Tab label="MERKEZ BİNA SEVKİYAT" value="SVK" />
          <Tab label="YENİ BİNA SEVKİYAT" value="SVY" />
        </Tabs>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: "3 0 70%", minWidth: 700, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              left: 16,
              top: 16,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(8px)",
              padding: "16px 20px",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              minWidth: 280,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: "#333" }}>
              🔍 Filtreler
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, marginBottom: 4, color: "#555" }}>
                  Blok
                </label>
                <select
                  value={filterBlock}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    outline: "none",
                    fontSize: 14,
                    transition: "border 0.2s",
                  }}
                  onChange={(e) => setFilterBlock(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid #007bff")}
                  onBlur={(e) => (e.currentTarget.style.border = "1px solid #ccc")}
                  aria-label="Blok filtresi"
                >
                  <option value="">Tümü</option>
                  {"ABCDEFGHIJKL".split("").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Autocomplete
                options={kasaOptions}
                value={filterKasa}
                onInputChange={(_, v) => setFilterKasa(v)}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kasa Ara"
                    size="small"
                    variant="outlined"
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                  />
                )}
              />

              <Autocomplete
                options={parcaOptions}
                value={filterParca}
                onInputChange={(_, v) => setFilterParca(v)}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Parça Ara"
                    size="small"
                    variant="outlined"
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </div>
          </div>

          <Canvas
            shadows
            dpr={[1, 1]}
            camera={{ position: [0, 30, 60], fov: 50 }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            role="img"
            aria-label="3D warehouse visualization"
          >
            <KutuSelector
              kutular={kutular}
              setSelectedAmbar={setSelectedAmbar}
              setCameraTarget={setCameraTarget}
              setShowTopPanel={setShowTopPanel}
            />

            <hemisphereLight intensity={0.5} groundColor={"#111"} />
            <ambientLight intensity={0.25} />
            <directionalLight
              position={[50, 80, 50]}
              intensity={0.9}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-left={-80}
              shadow-camera-right={80}
              shadow-camera-top={80}
              shadow-camera-bottom={-80}
            />

            <CameraTargetController target={cameraTarget} />

            <Suspense fallback={null}>
              <ContactShadows
                position={[0, -0.15, 0]}
                opacity={0.6}
                width={200}
                height={200}
                blur={2}
                far={4}
              />
            </Suspense>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
              <planeGeometry args={[400, 400]} />
              <meshStandardMaterial color="#111" />
            </mesh>

            <gridHelper args={[300, 40, "#333", "#222"]} />

            <Forklift startX={50} z={-10} />

            {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((b) => {
              const blok = visibleKutular.filter(
                (k) => parseAmbarKod(k.ambarAdi).block.toUpperCase() === b
              );
              if (!blok.length) return null;
              const front = blok.reduce((p, c) => (c.position[2] < p.position[2] ? c : p));
              return (
                <Text
                  key={b}
                  position={[front.position[0], front.position[1] + 6, front.position[2] - 4]}
                  rotation={[0, Math.PI, 0]}
                  fontSize={1.4}
                  color="orange"
                >
                  {b}
                </Text>
              );
            })}

            {visibleKutular.map((k) => (
              <Kutu
                key={k.id}
                kutu={k}
                onSelect={(kk) => {
                  setSelectedAmbar(kk);
                  setCameraTarget([kk.position[0], kk.position[1] + 1.5, kk.position[2]]);
                  setShowTopPanel(true);
                }}
                isSelected={!!selectedAmbar && selectedAmbar.id === k.id}
              />
            ))}
          </Canvas>
        </div>

        {/* RIGHT PANEL: Selected Ambar Details */}
        {showTopPanel && selectedAmbar && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 380,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              padding: "20px 24px",
              borderRadius: 12,
              animation: "slideInRight 0.4s cubic-bezier(0.22,1,0.36,1)",
              zIndex: 200,
            }}
            role="complementary"
            aria-label="Selected warehouse details"
          >
            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowTopPanel(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#ff5c5c",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#e04848")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#ff5c5c")}
                aria-label="Close details panel"
              >
                ✕ Kapat
              </button>
            </div>

            <h2 style={{ marginTop: 4, marginBottom: 12, fontSize: 20, color: "#333" }}>
              {selectedAmbar.ambarAdi} Detayları
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <b>Kapasite:</b> {selectedAmbar.kapasite}
              </div>
              <div>
                <b>Ağırlık:</b> {selectedAmbar.agirlik.toFixed(1)} kg
              </div>
              <div>
                <b>Hacim:</b> {selectedAmbar.containerVolume?.toFixed(2)} m³
              </div>
              <div>
                <b>İç Yükseklik:</b> {selectedAmbar.containerInnerHeight?.toFixed(2)} m
              </div>
              <div>
                <b>Doluluk Oranı:</b> {(selectedAmbar.hacimDoluluk * 100).toFixed(1)}%
              </div>

              <h3 style={{ marginTop: 12, fontSize: 16, color: "#555" }}>Kasalar</h3>

              {selectedAmbar.children.length === 0 ? (
                <div style={{ fontSize: 12, color: "#999" }}>Kasa yok</div>
              ) : (
                selectedAmbar.children.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      background: "#f8f8f8",
                      borderRadius: 8,
                      border: "1px solid #e0e0e0",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8f8f8")}
                  >
                    <b>{c.kasaAdi}</b> → {c.parcaAdi}
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {c.kasaAgirlik} Kg / {c.kasaHacim} m³
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelfPage;
