"use client";

import { GlassCard } from "@/components/GlassCard";
import { 
  Upload, 
  Image as ImageIcon, 
  ScanSearch, 
  FileJson,
  ShieldCheck,
  ChevronRight,
  Info,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export default function ProcessPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleProcess = () => {
    setIsUploading(true);
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false);
      setResults({
        violation: "Triple Riding",
        confidence: 0.982,
        plate: "MH12 AB 1234",
        metadata: {
          timestamp: new Date().toISOString(),
          location: "Andheri Junction",
          weather: "Clear"
        }
      });
    }, 2000);
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="heading-h2">Process Image</h1>
        <p className="text-[16px] text-body mt-2 leading-[1.7]">Upload traffic surveillance footage for automated analysis using YOLOv8.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard className="relative border-dashed border-2 border-glass-border hover:border-brand/40 transition-all group flex flex-col items-center justify-center py-24 px-6 cursor-pointer bg-glass-bg/5">
            <div className="w-20 h-20 rounded-3xl bg-brand-softer flex items-center justify-center border border-brand/30 group-hover:scale-110 transition-transform shadow-lg shadow-brand/10">
              <Upload className="text-brand w-10 h-10" />
            </div>
            <h3 className="mt-8 heading-h3 !text-[24px]">Click or drag to upload</h3>
            <p className="text-body text-[14px] mt-3 text-center max-w-sm leading-relaxed">
              Supports JPEG, PNG, and MP4. Max file size 25MB. Images will be enhanced using <span className="text-brand font-medium">Zero-DCE</span> before processing.
            </p>
            <Button 
              onClick={handleProcess}
              disabled={isUploading}
              size="lg"
              className="mt-10 px-10 shadow-xl shadow-brand/20"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-3 border-[#060A12]/30 border-t-[#060A12] rounded-full animate-spin mr-3" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanSearch className="w-5 h-5 mr-2" />
                  Process Footage
                </>
              )}
            </Button>
          </GlassCard>

          {results && (
            <GlassCard title="Evidence Generation" className="relative animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-glass-border bg-[#060A12]/60 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <ImageIcon className="w-20 h-20 text-body" />
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-body">No Frame Data</span>
                  </div>
                  <span className="absolute bottom-6 left-6 glass-surface relative px-4 py-2 rounded-xl text-[12px] font-mono font-bold text-heading border-glass-border/40 backdrop-blur-md">
                    CAM_OUT_402 // ANDHERI_JN
                  </span>
                </div>
                
                {/* Simulated Bounding Box */}
                <div className="absolute top-[30%] left-[40%] w-[25%] h-[45%] border-3 border-danger rounded-2xl shadow-[0_0_40px_rgba(199,0,54,0.4),inset_0_0_20px_rgba(199,0,54,0.2)] animate-pulse">
                  <div className="absolute -top-10 left-0 bg-danger text-white text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4" />
                    {results.violation} 98.2%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: "Type", value: results.violation, color: "text-heading" },
                  { label: "Confidence", value: `${(results.confidence * 100).toFixed(1)}%`, color: "text-brand" },
                  { label: "Plate Number", value: results.plate, color: "text-heading" },
                  { label: "Status", value: "Flagged", color: "text-danger" },
                ].map((item) => (
                  <div key={item.label} className="glass-surface relative p-4 rounded-2xl border-glass-border-subtle bg-glass-bg/5">
                    <p className="text-[10px] text-body-subtle font-bold uppercase tracking-[0.1em]">{item.label}</p>
                    <p className={cn("text-lg font-bold mt-1", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-8">
          <GlassCard title="Processing Pipeline">
            <div className="space-y-6 mt-4">
              {[
                { title: "Image Preprocessing", desc: "CLAHE enhancement, Gamma correction, and Zero-DCE low-light recovery active.", icon: Info },
                { title: "Detection Engine", desc: "YOLOv8x + ByteTrack processing at ~15 FPS on NVIDIA T4.", icon: ScanSearch },
                { title: "ANPR Engine", desc: "PaddleOCR extracting Indian plate formats with 92% accuracy.", icon: ShieldCheck },
              ].map((step) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-glass-bg border border-glass-border flex items-center justify-center flex-shrink-0 shadow-sm">
                    <step.icon className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-heading">{step.title}</h4>
                    <p className="text-[13px] text-body mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Export Evidence">
            <div className="space-y-4 mt-6">
              <Button variant="secondary" className="w-full justify-between py-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <FileJson className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-[14px] font-bold text-heading">Download JSON</span>
                </div>
                <ChevronRight className="w-4 h-4 text-body-subtle group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="secondary" className="w-full justify-between py-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/20">
                    <ImageIcon className="w-4 h-4 text-brand" />
                  </div>
                  <span className="text-[14px] font-bold text-heading">Annotated JPEG</span>
                </div>
                <ChevronRight className="w-4 h-4 text-body-subtle group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
