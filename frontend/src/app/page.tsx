"use client";

import { useState, useRef, useCallback } from "react";
import { DetectionResult } from "@/types/api";
import { uploadAndAnalyzeFile } from "@/services/api";

type Mode = "image" | "video";

// ── Constants ─────────────────────────────────────────────────────────────────

const VIOLATION_LABELS: Record<string, string> = {
  helmet_non_compliance: "No Helmet",
  seatbelt_violation:    "No Seatbelt",
  triple_riding:         "Triple Riding",
  wrong_side_driving:    "Wrong-Side Driving",
  stop_line_violation:   "Stop-Line Violation",
  red_light_violation:   "Red-Light Violation",
  illegal_parking:       "Illegal Parking",
};

const FINE_AMOUNTS: Record<string, number> = {
  helmet_non_compliance: 1000,
  seatbelt_violation:    1000,
  triple_riding:         1000,
  wrong_side_driving:    5000,
  stop_line_violation:   1000,
  red_light_violation:   5000,
  illegal_parking:       500,
};

const VIOLATION_DESCRIPTIONS: Record<string, string> = {
  helmet_non_compliance: "Rider detected without protective headgear",
  seatbelt_violation:    "Driver/passenger not wearing seatbelt",
  triple_riding:         "More than 2 persons on a two-wheeler",
  wrong_side_driving:    "Vehicle traveling against traffic flow",
  stop_line_violation:   "Vehicle crossed the stop line at junction",
  red_light_violation:   "Vehicle passed signal during red phase",
  illegal_parking:       "Vehicle parked in a no-parking zone",
};

function vLabel(t: string)  { return VIOLATION_LABELS[t.toLowerCase()]       ?? t.replace(/_/g, " "); }
function vFine(t: string)   { return FINE_AMOUNTS[t.toLowerCase()]           ?? 1000; }
function vDesc(t: string)   { return VIOLATION_DESCRIPTIONS[t.toLowerCase()] ?? "Traffic rule violation detected"; }

function severityOf(conf: number): { label: string; color: string; bg: string } {
  if (conf >= 0.9)  return { label: "HIGH",   color: "#f87171", bg: "rgba(239,68,68,0.12)" };
  if (conf >= 0.75) return { label: "MEDIUM", color: "#fb923c", bg: "rgba(249,115,22,0.12)" };
  return               { label: "LOW",    color: "#facc15", bg: "rgba(234,179,8,0.12)" };
}

function signalColor(s?: string) {
  if (s === "red")   return "#ef4444";
  if (s === "green") return "#22c55e";
  if (s === "amber") return "#eab308";
  return "rgba(255,255,255,0.3)";
}

// ── Tiny shared UI primitives ─────────────────────────────────────────────────

const G = {
  card: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  innerBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
  },
  label: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)",
  },
  divider: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({
  file, accept, onChange, mode,
}: {
  file: File | null; accept: string;
  onChange: (f: File) => void; mode: Mode;
}) {
  const [hover, setHover] = useState(false);

  return (
    <label
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 12, padding: "36px 24px",
        border: `1.5px dashed ${hover ? "rgba(138,255,196,0.55)" : "rgba(138,255,196,0.22)"}`,
        borderRadius: 18, cursor: "pointer", textAlign: "center",
        background: hover ? "rgba(138,255,196,0.06)" : "rgba(138,255,196,0.02)",
        transition: "all .2s",
        position: "relative",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={e => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={e => {
        e.preventDefault(); setHover(false);
        const f = e.dataTransfer.files[0];
        if (f) onChange(f);
      }}
    >
      <input
        type="file" accept={accept}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }}
      />
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(138,255,196,0.10)", border: "1px solid rgba(138,255,196,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {mode === "image" ? (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#8AFFC4" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#8AFFC4" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        )}
      </div>

      {file ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#8AFFC4", fontFamily: "monospace", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB · {mode === "image" ? "Image" : "Video"} ready
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F0F6FC" }}>
            Drop your {mode === "image" ? "photo" : "video"} here
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {mode === "image" ? "JPG, PNG, WEBP, BMP" : "MP4, AVI, MKV, MOV, M4V"} · up to 100 MB
          </span>
        </div>
      )}
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<Mode>("image");

  // Files (kept per-mode so switching back doesn't lose selection)
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [vidFile, setVidFile] = useState<File | null>(null);

  // Detection state
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [annotated, setAnnotated] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image zoom + pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Lightbox
  const [lightbox, setLightbox] = useState(false);

  // Video options
  const [maxFrames, setMaxFrames] = useState("150");

  // ── Actions ──────────────────────────────────────────────────────────────

  const switchMode = (m: Mode) => {
    setMode(m);
    setResult(null);
    setAnnotated(null);
    setError(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLightbox(false);
  };

  const analyze = async () => {
    const file = mode === "image" ? imgFile : vidFile;
    if (!file) return;
    setRunning(true);
    setResult(null);
    setAnnotated(null);
    setError(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    try {
      const mf = mode === "video" ? (parseInt(maxFrames) || 150) : undefined;
      const r = await uploadAndAnalyzeFile(file, "CAM-01", mf);
      setResult(r);
      if (r.annotated_image_b64) {
        setAnnotated(`data:image/jpeg;base64,${r.annotated_image_b64}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed — check backend connection.");
    } finally {
      setRunning(false);
    }
  };

  const downloadImage = useCallback(() => {
    if (!annotated) return;
    const a = document.createElement("a");
    a.href = annotated;
    a.download = `trafficeye-detection-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [annotated]);

  const downloadReport = useCallback(() => {
    if (!result) return;
    const safe = { ...result, annotated_image_b64: "[omitted]" };
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trafficeye-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  // Mouse drag for pan (when zoomed in)
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);
  const onMouseUp = () => setDragging(false);

  const currentFile = mode === "image" ? imgFile : vidFile;
  const hasResult = !!result;
  const totalFines = result?.violations.reduce((s, v) => s + vFine(v.type), 0) ?? 0;
  const highConf = result?.violations.filter(v => v.confidence >= 0.9).length ?? 0;
  const maxByType = result?.by_type ? Math.max(...Object.values(result.by_type), 1) : 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        @keyframes scanLine {
          0%   { top:-4px; opacity:0; }
          15%  { opacity:.7; }
          85%  { opacity:.7; }
          100% { top:100%; opacity:0; }
        }
        *,:before,:after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Google Sans','Segoe UI',system-ui,sans-serif; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(138,255,196,.18); border-radius:3px; }
        input[type=number]::-webkit-inner-spin-button { opacity:.5; }
      `}</style>

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightbox && annotated && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={annotated}
            alt="Annotated detection — full resolution"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "96vw", maxHeight: "96vh", borderRadius: 12, objectFit: "contain", cursor: "default" }}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: "absolute", top: 20, right: 20, width: 40, height: 40,
              borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
          <button
            onClick={e => { e.stopPropagation(); downloadImage(); }}
            style={{
              position: "absolute", bottom: 24, right: 24, padding: "10px 20px",
              borderRadius: 10, background: "#8AFFC4", color: "#0C1F1A", fontWeight: 700,
              fontSize: 13, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
        </div>
      )}

      {/* ── Root ───────────────────────────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0C1F1A",
        backgroundImage: "radial-gradient(circle, rgba(100,200,150,0.11) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        position: "relative",
        color: "#F0F6FC",
      }}>
        {/* Depth glow at top */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(50,130,90,0.3) 0%, transparent 65%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 80px" }}>

          {/* ── Navbar ────────────────────────────────────────────────────── */}
          <nav style={{
            width: "100%", maxWidth: 900, marginTop: 20,
            background: "rgba(8,24,18,0.78)", backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, padding: "12px 22px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/TrafficEye-logo.png" alt="TrafficEye logo" style={{ height: 34, width: "auto", objectFit: "contain" }} />
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.3px" }}>TrafficEye</span>
            </div>
            <div style={{ display: "flex", gap: 26, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {(["Features", "How it works"] as const).map(l => (
                <a key={l} href="#detect" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>{l}</a>
              ))}
              <a href="https://traffic-violation-api-660444655892.asia-south1.run.app/docs" target="_blank" rel="noreferrer"
                style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>API Docs</a>
            </div>
            <a href="#detect" style={{
              padding: "8px 20px", borderRadius: 30, background: "#8AFFC4",
              color: "#0C1F1A", fontWeight: 700, fontSize: 13, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(138,255,196,0.25)",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#6BEFAB")}
              onMouseLeave={e => (e.currentTarget.style.background = "#8AFFC4")}
            >Detect Now</a>
          </nav>

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", marginTop: 64, marginBottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.58)", background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 99, padding: "5px 16px",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#8AFFC4", animation: "pulse 2s ease-in-out infinite" }} />
              Powered by YOLOv8x + EasyOCR · Google Cloud Run
            </span>

            <h1 style={{
              fontSize: "clamp(40px,6vw,68px)", fontWeight: 700, color: "#fff",
              lineHeight: 1.07, letterSpacing: "-1.5px", maxWidth: 680,
            }}>
              The intelligent<br />traffic violation<br />detector
            </h1>

            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.48)", maxWidth: 480, lineHeight: 1.65 }}>
              Upload a photo or video. AI detects helmets, red lights, wrong-side driving and reads license plates — instantly.
            </p>
          </div>

          {/* ── Detection Card ────────────────────────────────────────────── */}
          <div id="detect" style={{ ...G.card, width: "100%", maxWidth: 720, padding: "32px 32px 36px" }}>
            {/* Top edge highlight */}
            <div style={{ position: "absolute", top: 0, left: "12%", right: "12%", height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", pointerEvents: "none" }} />
            {/* Left edge highlight */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 1, height: "100%", background: "linear-gradient(180deg,rgba(255,255,255,0.14),transparent 60%,rgba(255,255,255,0.05))", pointerEvents: "none" }} />

            {/* ── Mode toggle ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.28)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
              {(["image", "video"] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    transition: "all .2s",
                    background: mode === m ? "#8AFFC4" : "transparent",
                    color: mode === m ? "#0C1F1A" : "rgba(255,255,255,0.45)",
                    boxShadow: mode === m ? "0 2px 10px rgba(138,255,196,0.25)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  {m === "image" ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  )}
                  {m === "image" ? "Image Detection" : "Video Detection"}
                </button>
              ))}
            </div>

            {/* ── Drop zone ───────────────────────────────────────────────── */}
            <DropZone
              file={currentFile}
              accept={mode === "image" ? "image/*,.jpg,.jpeg,.png,.bmp,.webp" : "video/*,.mp4,.avi,.mkv,.mov,.m4v"}
              onChange={f => {
                if (mode === "image") setImgFile(f);
                else setVidFile(f);
                setResult(null); setAnnotated(null); setError(null); setZoom(1); setPan({ x: 0, y: 0 });
              }}
              mode={mode}
            />

            {/* Video: max frames option */}
            {mode === "video" && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ ...G.label }}>Max frames to analyze</div>
                <input
                  type="number" value={maxFrames} min={10} max={1000}
                  onChange={e => setMaxFrames(e.target.value)}
                  style={{
                    width: 90, padding: "7px 12px", fontSize: 13, fontFamily: "monospace",
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, color: "#fff", outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(138,255,196,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>150 = fast demo, higher = more thorough</span>
              </div>
            )}

            {/* ── Analyze button ──────────────────────────────────────────── */}
            <button
              onClick={analyze}
              disabled={!currentFile || running}
              style={{
                width: "100%", marginTop: 18, padding: "13px 0", borderRadius: 13, border: "none",
                fontWeight: 700, fontSize: 14, cursor: (!currentFile || running) ? "not-allowed" : "pointer",
                background: (!currentFile || running) ? "rgba(138,255,196,0.18)" : "#8AFFC4",
                color: (!currentFile || running) ? "rgba(6,10,18,0.4)" : "#0C1F1A",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                transition: "all .2s",
                boxShadow: (!currentFile || running) ? "none" : "0 4px 18px rgba(138,255,196,0.28)",
              }}
              onMouseEnter={e => { if (currentFile && !running) (e.currentTarget as HTMLElement).style.background = "#6BEFAB"; }}
              onMouseLeave={e => { if (currentFile && !running) (e.currentTarget as HTMLElement).style.background = "#8AFFC4"; }}
            >
              {running ? (
                <>
                  <svg style={{ animation: "spin .8s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".2"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  Running YOLOv8x inference…
                </>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Analyze {mode === "image" ? "Image" : "Video"}
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14, padding: "12px 16px", borderRadius: 10,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                fontSize: 12, color: "#f87171", lineHeight: 1.5,
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* ── Loading state ───────────────────────────────────────────── */}
            {running && (
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "16px 0" }}>
                <div style={{ position: "relative", width: 58, height: 58 }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: 16,
                    background: "rgba(138,255,196,0.08)", border: "1px solid rgba(138,255,196,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Scan line */}
                    <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#8AFFC4,transparent)", animation: "scanLine 2s ease-in-out infinite" }} />
                    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#8AFFC4" strokeWidth={1.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  </div>
                  <div style={{ position: "absolute", inset: -3, borderRadius: 19, border: "2px solid rgba(138,255,196,0.22)", animation: "pulse 1.8s ease-in-out infinite" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F6FC" }}>
                    {mode === "image" ? "Detecting violations in image…" : "Analyzing video frame by frame…"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                    {mode === "image" ? "YOLOv8x inference · EasyOCR plate reading" : "Processing frames · extracting violations"}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── RESULTS ─────────────────────────────────── */}
            {hasResult && result && (
              <div style={{ marginTop: 32, animation: "fadeUp .4s ease both" }}>

                {/* Results header divider */}
                <div style={{ ...G.divider, display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingTop: 0 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <span style={{ ...G.label, color: "#8AFFC4", fontSize: 10 }}>Analysis Results</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* ── Annotated image (image mode) ─────────────────────── */}
                {annotated && (
                  <div style={{ marginBottom: 20 }}>
                    {/* Image container with zoom+pan */}
                    <div
                      style={{
                        borderRadius: 14, overflow: "hidden",
                        border: "1px solid rgba(138,255,196,0.2)",
                        cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
                        userSelect: "none",
                        position: "relative",
                      }}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseUp}
                      onDoubleClick={() => setLightbox(true)}
                      title="Double-click to open fullscreen"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={annotated}
                        alt="YOLOv8x annotated detection"
                        draggable={false}
                        style={{
                          width: "100%", height: "auto", display: "block",
                          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                          transformOrigin: "center center",
                          transition: dragging ? "none" : "transform .2s ease",
                        }}
                      />
                      {/* Overlay badges */}
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap", pointerEvents: "none" }}>
                        <span style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", color: "#8AFFC4", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(138,255,196,0.25)", fontFamily: "monospace" }}>
                          YOLOv8x · {result.processing_ms?.toFixed(0)}ms
                        </span>
                        {result.signal && result.signal !== "unknown" && (
                          <span style={{
                            background: `${signalColor(result.signal)}cc`, backdropFilter: "blur(6px)", color: "#fff",
                            fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, fontFamily: "monospace",
                          }}>
                            🚦 {result.signal.toUpperCase()} LIGHT
                          </span>
                        )}
                      </div>
                      {result.total_violations > 0 && (
                        <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,0.88)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, pointerEvents: "none" }}>
                          {result.total_violations} VIOLATION{result.total_violations > 1 ? "S" : ""}
                        </span>
                      )}
                      {/* Double-click hint */}
                      <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}>
                        Double-click to fullscreen
                      </span>
                    </div>

                    {/* Zoom + action controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      {/* Zoom controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                        {[
                          { label: "−", action: () => { setZoom(z => Math.max(z - 0.5, 1)); if (zoom <= 1.5) setPan({ x: 0, y: 0 }); } },
                          { label: `${Math.round(zoom * 100)}%`, action: () => { setZoom(1); setPan({ x: 0, y: 0 }); } },
                          { label: "+", action: () => setZoom(z => Math.min(z + 0.5, 4)) },
                        ].map(({ label: lbl, action }, i) => (
                          <button key={i} onClick={action} style={{
                            padding: "6px 12px", border: "none",
                            background: i === 1 ? "rgba(255,255,255,0.06)" : "transparent",
                            color: i === 1 ? "rgba(255,255,255,0.55)" : "#8AFFC4",
                            fontSize: i === 1 ? 11 : 15, fontWeight: 700, cursor: "pointer",
                            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                            minWidth: i === 1 ? 46 : 32, textAlign: "center",
                          }}>{lbl}</button>
                        ))}
                      </div>

                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        {/* Fullscreen */}
                        <button onClick={() => setLightbox(true)} style={{
                          padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                          Fullscreen
                        </button>
                        {/* Download */}
                        <button onClick={downloadImage} style={{
                          padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(138,255,196,0.3)",
                          background: "rgba(138,255,196,0.08)", color: "#8AFFC4", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Summary stats row ─────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Violations",  value: result.total_violations, color: result.total_violations > 0 ? "#8AFFC4" : "#34d399" },
                    { label: "High conf.",  value: highConf, color: "#F0F6FC" },
                    { label: "Est. fines",  value: `₹${totalFines.toLocaleString()}`, color: "#fb923c" },
                    { label: mode === "video" ? "Frames" : "Proc. time",
                      value: mode === "video" && result.total_frames
                        ? result.total_frames
                        : result.processing_ms < 1000
                          ? `${result.processing_ms.toFixed(0)}ms`
                          : `${(result.processing_ms / 1000).toFixed(1)}s`,
                      color: "#F0F6FC" },
                  ].map(({ label: lbl, value, color }) => (
                    <div key={lbl} style={{ ...G.innerBox, padding: "12px 14px" }}>
                      <div style={{ ...G.label, marginBottom: 5 }}>{lbl}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* ── Signal + Object counts (image mode) ──────────────── */}
                {(result.signal || result.object_counts) && (
                  <div style={{ ...G.innerBox, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    {result.signal && result.signal !== "unknown" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 11, height: 11, borderRadius: "50%", background: signalColor(result.signal), boxShadow: `0 0 8px ${signalColor(result.signal)}` }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F6FC" }}>{result.signal.toUpperCase()} LIGHT</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>detected at junction</span>
                      </div>
                    )}
                    {result.object_counts && Object.entries(result.object_counts).length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {Object.entries(result.object_counts).map(([obj, cnt]) => (
                          <span key={obj} style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                            {obj} ×{cnt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Video: breakdown chart ────────────────────────────── */}
                {result.by_type && Object.keys(result.by_type).length > 0 && (
                  <div style={{ ...G.innerBox, padding: "16px 18px", marginBottom: 16 }}>
                    <div style={{ ...G.label, color: "#8AFFC4", marginBottom: 14 }}>Violation Breakdown by Type</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {Object.entries(result.by_type).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", width: 150, flexShrink: 0 }}>{vLabel(type)}</span>
                          <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: "#8AFFC4", width: `${(count / maxByType) * 100}%`, transition: "width .8s ease" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#F0F6FC", minWidth: 22, textAlign: "right" }}>{count}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", minWidth: 38, textAlign: "right" }}>₹{(count * vFine(type)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Violations detail list ────────────────────────────── */}
                {result.violations.length > 0 ? (
                  <div style={{ ...G.innerBox, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...G.label, color: "#8AFFC4" }}>Detected Violations</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{result.violations.length} total · Est. ₹{totalFines.toLocaleString()} in fines</span>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {result.violations.map((v, i) => {
                        const sev = severityOf(v.confidence);
                        const confPct = Math.round(v.confidence * 100);
                        return (
                          <div key={i} style={{
                            padding: "14px 16px",
                            borderBottom: i < result.violations.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F6FC" }}>{vLabel(v.type)}</span>
                                  <span style={{
                                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                    background: sev.bg, color: sev.color,
                                    border: `1px solid ${sev.color}44`,
                                  }}>{sev.label}</span>
                                  {v.frame != null && (
                                    <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>frame {v.frame}</span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{vDesc(v.type)}</div>
                                {/* Confidence bar */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                                    <div style={{
                                      height: "100%", borderRadius: 2,
                                      width: `${confPct}%`,
                                      background: v.confidence >= 0.9 ? "#8AFFC4" : v.confidence >= 0.75 ? "#fb923c" : "#facc15",
                                      transition: "width .8s ease",
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", minWidth: 36 }}>{confPct}%</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: "#8AFFC4" }}>₹{vFine(v.type).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>fine</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "28px 0", marginBottom: 16 }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>No violations detected</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                      {mode === "image" ? "This image appears fully compliant." : "No violations found across analyzed frames."}
                    </div>
                  </div>
                )}

                {/* ── License plates ────────────────────────────────────── */}
                {result.plates && result.plates.length > 0 && (
                  <div style={{ ...G.innerBox, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ ...G.label, color: "#8AFFC4", marginBottom: 12 }}>License Plates — EasyOCR</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {result.plates.map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontFamily: "monospace", fontWeight: 800, fontSize: 16,
                            color: "#8AFFC4", background: "rgba(0,0,0,0.45)",
                            border: "1.5px solid rgba(138,255,196,0.35)",
                            borderRadius: 8, padding: "6px 14px", letterSpacing: "0.14em",
                          }}>
                            {p.plate_text || "UNREAD"}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                            background: p.valid ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.12)",
                            color: p.valid ? "#34d399" : "#94a3b8",
                            border: p.valid ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(148,163,184,0.2)",
                          }}>
                            {p.valid ? "✓ VALID" : "INVALID"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Download report (video) / summary (both) ─────────── */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={downloadReport} style={{
                    flex: 1, padding: "10px 0", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download JSON Report
                  </button>
                  {annotated && (
                    <button onClick={downloadImage} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10,
                      border: "1px solid rgba(138,255,196,0.3)", background: "rgba(138,255,196,0.08)",
                      color: "#8AFFC4", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Annotated Image
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div style={{
            marginTop: 64, width: "100%", maxWidth: 720,
            borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>TrafficEye</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                YOLOv8x + EasyOCR · Flipkart GridLock Hackathon 2025
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              <a href="https://traffic-violation-api-660444655892.asia-south1.run.app/docs" target="_blank" rel="noreferrer"
                style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8AFFC4")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>API Docs ↗</a>
              <a href="https://traffic-violation-api-660444655892.asia-south1.run.app/health" target="_blank" rel="noreferrer"
                style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8AFFC4")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>Health Check</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
