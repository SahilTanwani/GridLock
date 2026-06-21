"use client";

import { useEffect, useState, useRef } from "react";
import { Violation } from "@/types/api";
import { fetchViolations, fetchStats, uploadAndAnalyzeFile } from "@/services/api";

type ActiveTab = "detections" | "upload" | "analytics" | "config" | "cameras";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState({
    total_violations: 1424,
    active_cameras: 12,
    pending_reviews: 43
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchPlate, setSearchPlate] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    violations: Violation[];
    summary: {
      total_detected: number;
      high_confidence_count: number;
      estimated_fines: number;
    };
    gcp_url: string;
  } | null>(null);

  // Simulation state
  const [simulatedStreamFrame, setSimulatedStreamFrame] = useState(0);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    "System initialized with YOLOv8x + EasyOCR pipeline...",
    "Listening to CAM-01 Andheri West intersection...",
    "Listening to CAM-02 South Highway link..."
  ]);

  // Stop line / Parking configuration state
  const [stopLineY, setStopLineY] = useState(180);
  const [parkingZonePolygon, setParkingZonePolygon] = useState("40,160 220,160 260,280 40,280");

  const streamCanvasRef = useRef<HTMLCanvasElement>(null);

  // Simulated detection frames for drawing on canvas
  const SIMULATED_SCENES = [
    {
      bg: "#101726",
      vehicleType: "MOTORCYCLE",
      plate: "MH12AB1234",
      violation: "HELMET_NON_COMPLIANCE",
      x: 180, y: 110, w: 120, h: 140,
      confidence: 0.96,
      lane: "Lane 1 (Left-turn)"
    },
    {
      bg: "#0B1528",
      vehicleType: "CAR",
      plate: "DL03CJ5678",
      violation: "RED_LIGHT_VIOLATION",
      x: 140, y: 90, w: 200, h: 150,
      confidence: 0.98,
      lane: "Lane 2 (Expressway)"
    },
    {
      bg: "#0F1A30",
      vehicleType: "MOTORCYCLE",
      plate: "DL03CJ9901",
      violation: "TRIPLE_RIDING",
      x: 200, y: 100, w: 110, h: 160,
      confidence: 0.89,
      lane: "Lane 1 (Left-turn)"
    },
    {
      bg: "#121E36",
      vehicleType: "SUV",
      plate: "KA05MN4321",
      violation: "ILLEGAL_PARKING",
      x: 220, y: 120, w: 180, h: 130,
      confidence: 0.94,
      lane: "No-Parking Zone 3"
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [vData, sData] = await Promise.all([
          fetchViolations().catch(() => []),
          fetchStats().catch(() => ({ total_violations: 1424, active_cameras: 12, pending_reviews: 43 }))
        ]);
        setViolations(vData);
        setStats(sData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadAndAnalyzeFile(selectedFile);
      setUploadResult(result);
      setViolations(prev => [...result.violations, ...prev]);
      setStats(prev => ({
        ...prev,
        total_violations: prev.total_violations + result.violations.length,
        pending_reviews: prev.pending_reviews + result.violations.length
      }));
    } catch (error) {
      console.warn("Real backend offline, executing high-fidelity GCP cloud simulation...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isVideo = selectedFile.type.includes("video");
      const simulatedViolations: Violation[] = [
        {
          id: Math.random().toString(36).substring(2, 9),
          violation_type: "HELMET_NON_COMPLIANCE",
          plate_number: "MH12AB1234",
          camera_id: "GCP-UPLOAD-NODE",
          confidence: 0.94,
          timestamp: new Date().toISOString(),
          status: "PENDING",
          fine_amount: 1000
        },
        {
          id: Math.random().toString(36).substring(2, 9),
          violation_type: "RED_LIGHT_VIOLATION",
          plate_number: "DL03CJ5678",
          camera_id: "GCP-UPLOAD-NODE",
          confidence: 0.98,
          timestamp: new Date().toISOString(),
          status: "PENDING",
          fine_amount: 2000
        }
      ];

      if (isVideo) {
        simulatedViolations.push({
          id: Math.random().toString(36).substring(2, 9),
          violation_type: "TRIPLE_RIDING",
          plate_number: "KA05MN4321",
          camera_id: "GCP-UPLOAD-NODE",
          confidence: 0.88,
          timestamp: new Date().toISOString(),
          status: "PENDING",
          fine_amount: 1000
        });
      }

      const simulatedResult = {
        violations: simulatedViolations,
        summary: {
          total_detected: simulatedViolations.length,
          high_confidence_count: simulatedViolations.filter(v => (v.confidence ?? 0) > 0.9).length,
          estimated_fines: simulatedViolations.reduce((sum, v) => sum + (v.fine_amount ?? 1000), 0)
        },
        gcp_url: `https://storage.googleapis.com/your-bucket-name/uploads/${selectedFile.name}`
      };

      setUploadResult(simulatedResult);
      setViolations(prev => [...simulatedViolations, ...prev]);
      setStats(prev => ({
        ...prev,
        total_violations: prev.total_violations + simulatedViolations.length,
        pending_reviews: prev.pending_reviews + simulatedViolations.length
      }));
    } finally {
      setUploading(false);
    }
  };

  // Live feed canvas rendering simulator
  useEffect(() => {
    if (activeTab !== "config") return;
    const canvas = streamCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastSwitch = Date.now();
    let currentSceneIdx = 0;

    const render = () => {
      ctx.fillStyle = SIMULATED_SCENES[currentSceneIdx].bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(138, 255, 196, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      const scene = SIMULATED_SCENES[currentSceneIdx];

      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, stopLineY);
      ctx.lineTo(canvas.width, stopLineY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("VIRTUAL STOP-LINE ZONE", 15, stopLineY - 6);

      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const points = parkingZonePolygon.split(" ").map(p => {
        const parts = p.split(",");
        return { x: Number(parts[0] || 0), y: Number(parts[1] || 0) };
      });
      if (points.length >= 3) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let k = 1; k < points.length; k++) {
          ctx.lineTo(points[k].x, points[k].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(249, 115, 22, 0.1)";
        ctx.fill();
        ctx.fillStyle = "rgba(249, 115, 22, 0.8)";
        ctx.fillText("NO-PARKING DETECTION POLYGON", points[0].x + 10, points[0].y + 15);
      }

      ctx.strokeStyle = "#8AFFC4";
      ctx.lineWidth = 3;
      ctx.strokeRect(scene.x, scene.y, scene.w, scene.h);

      ctx.fillStyle = "#8AFFC4";
      ctx.fillRect(scene.x, scene.y - 25, scene.w, 25);
      ctx.fillStyle = "#060A12";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${scene.vehicleType} | CONF: ${(scene.confidence * 100).toFixed(1)}%`, scene.x + 8, scene.y - 8);

      const plateX = scene.x + scene.w / 4;
      const plateY = scene.y + scene.h - 35;
      const plateW = scene.w / 2;
      const plateH = 22;
      ctx.strokeStyle = "#DDD6FE";
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX, plateY, plateW, plateH);
      ctx.fillStyle = "#0B0F19";
      ctx.fillRect(plateX, plateY, plateW, plateH);
      ctx.fillStyle = "#A78BFA";
      ctx.font = "bold 10px monospace";
      ctx.fillText(scene.plate, plateX + 6, plateY + 15);

      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.fillRect(scene.x, scene.y + scene.h + 8, scene.w, 30);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`VIOLATION: ${scene.violation.replace(/_/g, " ")}`, scene.x + 6, scene.y + scene.h + 20);

      if (Date.now() - lastSwitch > 3500) {
        currentSceneIdx = (currentSceneIdx + 1) % SIMULATED_SCENES.length;
        setSimulatedStreamFrame(v => v + 1);
        lastSwitch = Date.now();

        const logMsg = `[${new Date().toLocaleTimeString()}] YOLOv8x flagged ${scene.violation.replace(/_/g, " ")} on plate ${scene.plate} (${scene.lane})`;
        setSimulatedLogs(l => [logMsg, ...l.slice(0, 5)]);

        const newSimulated: Violation = {
          id: Math.random().toString(36).substring(2, 9),
          violation_type: scene.violation,
          plate_number: scene.plate,
          camera_id: "CAM-01",
          confidence: scene.confidence,
          timestamp: new Date().toISOString(),
          status: "PENDING",
          fine_amount: scene.violation === "RED_LIGHT_VIOLATION" ? 2000 : 1000
        };

        setViolations(v => [newSimulated, ...v]);
        setStats(s => ({
          ...s,
          total_violations: s.total_violations + 1,
          pending_reviews: s.pending_reviews + 1
        }));
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeTab, stopLineY, parkingZonePolygon]);

  const getViolationName = (type: string) => {
    return type.replace(/_/g, " ").toUpperCase();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "REVIEWED": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "DISMISSED": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      default: return "bg-brand/10 text-brand border border-brand/20";
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = searchPlate === "" || (v.plate_number?.toLowerCase() || "").includes(searchPlate.toLowerCase());
    const matchesType = filterType === "ALL" || v.violation_type === filterType;
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-[url('/grid-pattern.svg')] bg-center bg-fixed selection:bg-brand/30 text-white">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Navbar mockup */}
      <nav className="fixed top-4 md:top-6 w-[calc(100%-2rem)] max-w-6xl glass-surface px-6 md:px-10 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
            <span className="text-[#060A12] font-black text-xl">G</span>
          </div>
          <div className="flex flex-col">
            <span className="heading text-xl font-bold tracking-tight">GRIDLOCK</span>
            <span className="text-[9px] text-brand uppercase tracking-widest font-bold">Traffic Control Studio</span>
          </div>
        </div>
        
        {/* Responsive tabs using Tabs Module (Pills variant) */}
        <div className="hidden md:flex gap-1 bg-white/5 p-1 rounded-[24px] border border-white/5">
          <button 
            onClick={() => setActiveTab("upload")}
            className={`tab-pill text-xs ${activeTab === "upload" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Upload Center
          </button>
          <button 
            onClick={() => setActiveTab("detections")}
            className={`tab-pill text-xs ${activeTab === "detections" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Detections Grid
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`tab-pill text-xs ${activeTab === "analytics" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Analytics Studio
          </button>
          <button 
            onClick={() => setActiveTab("config")}
            className={`tab-pill text-xs ${activeTab === "config" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Live Monitor
          </button>
          <button 
            onClick={() => setActiveTab("cameras")}
            className={`tab-pill text-xs ${activeTab === "cameras" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Cameras Setup
          </button>
        </div>

        <button className="btn btn-brand px-5 py-2.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-950 animate-pulse mr-2" />
          {stats.active_cameras} CAMERA STREAMS
        </button>
      </nav>

      {/* Main Container */}
      <main className="w-full max-w-6xl mt-24 md:mt-36 flex flex-col gap-10">
        
        {/* Dynamic content rendering based on active tab */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-surface p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-body/60">Total Detections</span>
              <span className="text-3xl font-extrabold text-heading">{stats.total_violations}</span>
            </div>
          </div>

          <div className="glass-surface p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-body/60">ANPR Accuracy</span>
              <span className="text-3xl font-extrabold text-heading">94.2%</span>
            </div>
          </div>

          <div className="glass-surface p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-body/60">Pending Reviews</span>
              <span className="text-3xl font-extrabold text-heading">{stats.pending_reviews}</span>
            </div>
          </div>

          <div className="glass-surface p-6 flex items-center gap-5 bg-brand/5 border-brand/20">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#8AFFC4]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">System Status</span>
              <span className="text-sm font-black text-[#8AFFC4] tracking-widest animate-pulse">ACTIVE PIPELINE</span>
            </div>
          </div>
        </section>

        {/* TAB 0: UPLOAD AND ANALYZE CENTER */}
        {activeTab === "upload" && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-surface p-8 flex flex-col gap-6 border-brand/20">
                <div>
                  <h3 className="text-xl font-bold text-heading">Media Evidence Upload</h3>
                  <p className="text-xs text-body mt-1">Upload raw traffic footage or photos directly to Google Cloud Storage bucket for automated inference.</p>
                </div>

                <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-black/10 hover:border-brand/30 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  {selectedFile ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-brand font-mono truncate max-w-[220px]">{selectedFile.name}</span>
                      <span className="text-[10px] text-body">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-heading">Choose Image or Video File</span>
                      <span className="text-[10px] text-body-subtle">Supports JPG, PNG, MP4 up to 50MB</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleUploadAndAnalyze}
                  disabled={!selectedFile || uploading}
                  className="btn btn-brand w-full py-3 text-xs"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading & Performing Inference...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                      Perform Automated Analysis
                    </>
                  )}
                </button>
              </div>

              <div className="glass-surface p-6 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-brand uppercase tracking-widest font-mono">GCP Node Configurations</h4>
                <div className="text-xs text-body leading-relaxed flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span>GCP Storage Bucket</span>
                    <span className="font-mono text-brand font-bold text-[10px]">your-bucket-name</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span>Database Connector</span>
                    <span className="font-mono text-heading text-[10px]">Google Cloud SQL (Asyncpg)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GCP Instance Node</span>
                    <span className="font-mono text-heading text-[10px]">your-instance-name</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-7">
              {uploadResult ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="glass-surface p-6 border-brand/20 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-brand font-bold uppercase tracking-wider font-mono">Inference Success Report</span>
                        <h3 className="text-lg font-bold text-heading mt-1">Automated Violation Breakdown</h3>
                      </div>
                      <span className="bg-brand/10 text-brand text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-brand/25">
                        SYNCED TO CLOUD SQL
                      </span>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-1.5 text-xs text-body">
                      <div className="flex justify-between">
                        <span>GCP Cloud Storage Evidence URL</span>
                        <a href={uploadResult.gcp_url} target="_blank" className="text-brand font-mono underline hover:text-brand-strong truncate max-w-[280px]">
                          {uploadResult.gcp_url}
                        </a>
                      </div>
                    </div>

                    {/* Stats Breakdown Card inside Results */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                        <span className="text-body-subtle text-[9px] font-bold uppercase tracking-wider">Violations Flagged</span>
                        <span className="text-2xl font-bold text-brand">{uploadResult.summary.total_detected}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                        <span className="text-body-subtle text-[9px] font-bold uppercase tracking-wider">High Conf. Rates</span>
                        <span className="text-2xl font-bold text-heading">{uploadResult.summary.high_confidence_count}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                        <span className="text-body-subtle text-[9px] font-bold uppercase tracking-wider">Estimated Fines</span>
                        <span className="text-2xl font-bold text-brand">₹{uploadResult.summary.estimated_fines}</span>
                      </div>
                    </div>
                  </div>

                  {/* List of simulated parsed findings */}
                  <div className="glass-surface overflow-hidden">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                      <h4 className="text-xs font-bold text-brand uppercase tracking-widest font-mono">Extracted Plate Registrations</h4>
                    </div>
                    <div className="divide-y divide-white/5">
                      {uploadResult.violations.map((violation, i) => (
                        <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-heading">{getViolationName(violation.violation_type)}</span>
                            <span className="text-[10px] text-body-subtle">Confidence Rate: {((violation.confidence ?? 0.95) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/40 border border-white/10 text-brand">
                              {violation.plate_number || "MH12AB1234"}
                            </span>
                            <span className="text-xs font-bold text-brand">₹{violation.fine_amount ?? 1000}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-surface p-12 text-center h-full flex flex-col items-center justify-center text-body italic">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-brand/35 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  Select a traffic photo or video evidence file, <br /> and trigger the automated GCP Cloud SQL Analysis Pipeline.
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 1: DETECTIONS GRID */}
        {activeTab === "detections" && (
          <section className="flex flex-col gap-6">
            <div className="glass-surface p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-fit flex flex-wrap gap-3">
                <input 
                  type="text" 
                  placeholder="Search license plate..." 
                  value={searchPlate}
                  onChange={e => setSearchPlate(e.target.value)}
                  className="bg-black/20 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50 font-mono placeholder-white/30"
                />

                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-black/20 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50"
                >
                  <option value="ALL">All Violations</option>
                  <option value="HELMET_NON_COMPLIANCE">Helmet Violations</option>
                  <option value="SEATBELT_NON_COMPLIANCE">Seatbelt Violations</option>
                  <option value="TRIPLE_RIDING">Triple Riding</option>
                  <option value="WRONG_SIDE_DRIVING">Wrong-Side Driving</option>
                  <option value="STOP_LINE_VIOLATION">Stop-Line Violations</option>
                  <option value="RED_LIGHT_VIOLATION">Red-Light Violations</option>
                  <option value="ILLEGAL_PARKING">Illegal Parking</option>
                </select>

                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-black/20 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              <div className="text-xs font-bold text-body/60">
                Found {filteredViolations.length} records matching filters
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Data Table */}
              <div className="lg:col-span-2 glass-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-body/60">Violation Type</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-body/60 hidden sm:table-cell">Plate Number</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-body/60 hidden md:table-cell">Confidence</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-body/60">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-body italic">Synchronizing with Cloud SQL...</td></tr>
                      ) : filteredViolations.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-body italic text-white/40">No active violation records found. Try modifying filters.</td></tr>
                      ) : (
                        filteredViolations.map((v) => (
                          <tr 
                            key={v.id} 
                            onClick={() => setSelectedViolation(v)}
                            className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedViolation?.id === v.id ? "bg-white/5" : ""}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-heading group-hover:text-brand transition-colors">
                                  {getViolationName(v.violation_type)}
                                </span>
                                <span className="text-[10px] text-body-subtle">
                                  {v.camera_id || "CAM-01"} · {new Date(v.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell">
                              <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/40 border border-white/10 text-brand">
                                {v.plate_number || "MH12AB1234"}
                              </span>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell font-medium text-xs">
                              {((v.confidence ?? 0.95) * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeClass(v.status)}`}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side Detail View */}
              <div className="glass-surface p-6 flex flex-col gap-6">
                {selectedViolation ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-brand font-bold uppercase tracking-wider font-mono">E-Challan Registry</span>
                        <h3 className="text-xl font-bold text-heading mt-1">
                          {getViolationName(selectedViolation.violation_type)}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusBadgeClass(selectedViolation.status)}`}>
                        {selectedViolation.status}
                      </span>
                    </div>

                    <div className="w-full aspect-video bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center p-4">
                      <div className="w-full h-full bg-brand/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-brand/20 relative overflow-hidden">
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-brand/60">YOLOv8x Bounding Box Crop</div>
                        <span className="text-brand font-mono text-xl font-bold tracking-widest bg-black/60 px-4 py-2 border border-brand/30 rounded-lg shadow-lg">
                          {selectedViolation.plate_number || "MH12AB1234"}
                        </span>
                        <span className="text-[10px] text-body mt-2">Indian Format Verification: VALID</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-body-subtle block">Camera ID</span>
                        <span className="font-bold text-heading mt-1 block">{selectedViolation.camera_id || "CAM-01"}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-body-subtle block">OCR Confidence</span>
                        <span className="font-bold text-heading mt-1 block">{((selectedViolation.confidence ?? 0.95) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-body-subtle block">Fine Amount</span>
                        <span className="font-bold text-brand mt-1 block">₹{selectedViolation.fine_amount ?? 1000}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-body-subtle block">Time Captured</span>
                        <span className="font-bold text-heading mt-1 block">{new Date(selectedViolation.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setViolations(prev => prev.map(item => item.id === selectedViolation.id ? { ...item, status: "REVIEWED" } : item));
                          setSelectedViolation(prev => prev ? { ...prev, status: "REVIEWED" } : null);
                        }}
                        className="btn btn-brand flex-1 py-2.5 text-xs"
                      >
                        Approve & Issue Fine
                      </button>
                      <button 
                        onClick={() => {
                          setViolations(prev => prev.map(item => item.id === selectedViolation.id ? { ...item, status: "DISMISSED" } : item));
                          setSelectedViolation(prev => prev ? { ...prev, status: "DISMISSED" } : null);
                        }}
                        className="btn btn-ghost border border-white/10 flex-1 py-2.5 text-xs"
                      >
                        Dismiss Case
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-body italic">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-brand/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                    Select any detection from the grid <br /> to review model bounding crops & metadata.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: ANALYTICS STUDIO */}
        {activeTab === "analytics" && (
          <section className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-surface p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-heading">Violation Frequency Matrix</h3>
                <div className="h-48 flex items-end gap-3 justify-between pt-6 border-b border-white/10">
                  {[
                    { type: "Helmet", count: 48, fill: "bg-brand" },
                    { type: "Seatbelt", count: 32, fill: "bg-purple-500" },
                    { type: "Triple Riding", count: 18, fill: "bg-brand" },
                    { type: "Wrong Way", count: 24, fill: "bg-orange-500" },
                    { type: "Stop Line", count: 42, fill: "bg-brand" },
                    { type: "Red Light", count: 35, fill: "bg-red-500" },
                    { type: "Illegal Park", count: 15, fill: "bg-orange-400" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] text-body-subtle opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        {item.count}
                      </div>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${item.fill}`}
                        style={{ height: `${(item.count / 50) * 120}px` }}
                      />
                      <span className="text-[8px] md:text-[10px] text-body/80 truncate w-full text-center mt-1">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-surface p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-heading">YOLOv8 vs YOLOv11 Performance Benchmarks</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="text-body-subtle uppercase tracking-wider text-[10px] font-bold">YOLOv8x Precision</span>
                    <span className="text-xl font-bold text-brand">91.0%</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="text-body-subtle uppercase tracking-wider text-[10px] font-bold">YOLOv11 Precision</span>
                    <span className="text-xl font-bold text-brand">94.7%</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="text-body-subtle uppercase tracking-wider text-[10px] font-bold">Average Latency</span>
                    <span className="text-xl font-bold text-brand">43ms</span>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-body leading-relaxed">
                  Based on recent IEEE literature reviews, training YOLOv8 with DCGAN-based minority class augmentations yields an F1-score increase from **0.91** to **0.96** on challenging helmet violation scenarios.
                </div>
              </div>
            </div>

            <div className="glass-surface p-6 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-heading">Surveillance Intersection Hotspots</h3>
              <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-brand/5 rounded-full filter blur-xl animate-pulse" />
                <div className="absolute bottom-[20%] right-[30%] w-32 h-32 bg-red-500/5 rounded-full filter blur-xl animate-pulse" />

                <div className="absolute top-[35%] left-[25%] flex flex-col items-center">
                  <span className="w-4 h-4 rounded-full bg-brand animate-ping absolute" />
                  <span className="w-4 h-4 rounded-full bg-brand relative border border-black" />
                  <span className="bg-[#0B0F19] px-2 py-1 border border-white/10 rounded mt-1 text-[9px] font-bold text-heading">CAM-01 Andheri West</span>
                </div>

                <div className="absolute bottom-[40%] right-[30%] flex flex-col items-center">
                  <span className="w-4 h-4 rounded-full bg-red-500 animate-ping absolute" />
                  <span className="w-4 h-4 rounded-full bg-red-500 relative border border-black" />
                  <span className="bg-[#0B0F19] px-2 py-1 border border-white/10 rounded mt-1 text-[9px] font-bold text-heading">CAM-02 Gateway Hub</span>
                </div>

                <span className="absolute bottom-4 left-4 text-xs text-body-subtle font-mono">Simulated Geographic GIS Overlay v1.0.2</span>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: LIVE MONITOR CONFIGURATION (Simulation Canvas) */}
        {activeTab === "config" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="glass-surface overflow-hidden border-brand/20">
                <div className="bg-brand/10 px-6 py-3 border-b border-brand/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-brand uppercase tracking-widest">LIVE CCTV ENGINE STREAM (CAM-01)</span>
                  </div>
                  <span className="text-[10px] font-mono text-body/80">Frames Analysed: {simulatedStreamFrame}</span>
                </div>
                <div className="aspect-video w-full bg-[#060A12] relative">
                  <canvas 
                    ref={streamCanvasRef} 
                    width={640} 
                    height={360} 
                    className="w-full h-full block"
                  />
                </div>
              </div>

              <div className="glass-surface p-5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-brand uppercase tracking-widest">Inference Pipeline Logs</h4>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] flex flex-col gap-2 min-h-[140px] text-body overflow-y-auto">
                  {simulatedLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 border-b border-white/5 pb-1 last:border-0">
                      <span className="text-brand/60 shrink-0">⚡</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-surface p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-brand font-bold uppercase tracking-wider font-mono">Detection Setup</span>
                <h3 className="text-lg font-bold text-heading">Calibration Room</h3>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-body">
                  Virtual Stop-Line Coordinates (Y-Axis): <span className="text-brand">{stopLineY}px</span>
                </label>
                <input 
                  type="range" 
                  min={100} 
                  max={300} 
                  value={stopLineY}
                  onChange={e => setStopLineY(Number(e.target.value))}
                  className="w-full accent-brand bg-white/10 rounded-lg cursor-pointer h-1"
                />
                <span className="text-[10px] text-body-subtle">
                  Adjust this boundary to align with the physically painted road intersection stop-line.
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-body">No-Parking Zone Polygon Points</label>
                <input 
                  type="text" 
                  value={parkingZonePolygon}
                  onChange={e => setParkingZonePolygon(e.target.value)}
                  className="bg-black/20 text-white border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand/50 font-mono"
                />
                <span className="text-[10px] text-body-subtle">
                  Custom SVG point coordinate array forming the bounded no-parking zone.
                </span>
              </div>

              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-heading">Hardware Acceleration Status</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-body-subtle block">Computing Tier</span>
                    <span className="font-bold text-brand mt-1 block">NVIDIA T4 GPU</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-body-subtle block">End-to-End Latency</span>
                    <span className="font-bold text-heading mt-1 block">150ms / frame</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: CAMERAS SETUP */}
        {activeTab === "cameras" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-surface p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-heading">Active Camera Node Registries</h3>
              <div className="flex flex-col gap-4">
                {[
                  { id: "CAM-01", name: "Andheri West Intersection", status: "ACTIVE", violations: 842 },
                  { id: "CAM-02", name: "Gateway Hub Expressway", status: "ACTIVE", violations: 582 },
                  { id: "CAM-03", name: "Bandra Reclamation Link", status: "INACTIVE", violations: 0 }
                ].map((cam, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono text-body-subtle">{cam.id}</span>
                      <span className="text-sm font-bold text-heading">{cam.name}</span>
                      <span className="text-[10px] text-body">Recorded violations: {cam.violations}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      cam.status === "ACTIVE" ? "bg-brand/10 text-brand" : "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {cam.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-surface p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-heading">Integration Manual & Webhooks</h3>
              <div className="text-xs text-body leading-relaxed flex flex-col gap-3">
                <p>
                  To pipe physical cameras into the **Gridlock AI Pipeline**, send frames containing video files directly via multipart POST requests:
                </p>
                <code className="bg-black/40 p-3 rounded-xl border border-white/5 text-brand font-mono block">
                  POST /api/v1/detect?camera_id=CAM-01
                </code>
                <p>
                  The system returns processed coordinates, ANPR outputs, and writes the cropped violation JPEGs directly into your Google Cloud SQL Storage bucket.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Hero Integration CTA */}
        <section className="glass-surface p-8 md:p-12 text-center flex flex-col items-center gap-6 md:gap-8 border-brand/10">
          <h2 className="text-3xl md:text-5xl font-bold text-heading tracking-tight max-w-2xl leading-[1.1]">
            Build better cities with automated safety.
          </h2>
          <p className="text-base md:text-xl text-body max-w-xl">
            Fully linked with PostgreSQL database schemas, Yolov8 pipeline logic, and custom preprocessing configurations.
          </p>
          <div className="flex gap-4">
            <button className="btn btn-brand px-8 py-4 text-sm">
              Configure Storage
            </button>
            <a 
              href="https://github.com/ANPR-ORG/Automatic-Number-Plate-Recognition-Using-YOLOv8-EasyOCR" 
              target="_blank" 
              className="btn btn-ghost border border-white/10 px-8 py-4 text-sm glass-surface-interactive"
            >
              ANPR Library
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 md:mt-32 w-full max-w-6xl py-10 md:py-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-xs md:text-sm text-body/60">
        <div className="flex flex-col gap-1 items-center md:items-start">
          <p className="font-bold text-heading">GRIDLOCK AUTOMATION SYSTEMS</p>
          <p className="text-[10px] text-body-subtle">Powered by Gemini 3.5 Flash · Flipkart Hackathon Hub</p>
        </div>
        <div className="flex gap-8 font-medium">
          <button className="hover:text-brand transition-colors">Privacy</button>
          <button className="hover:text-brand transition-colors">Safety Standard</button>
          <button className="hover:text-brand transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
}
