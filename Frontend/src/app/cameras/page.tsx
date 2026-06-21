"use client";

import { GlassCard } from "@/components/GlassCard";
import { 
  Camera, 
  MapPin, 
  Activity, 
  ShieldAlert,
  Settings2,
  Plus,
  Circle
} from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const cameras = [
  { id: "CAM-01", name: "Andheri Junction", location: "19.1136° N, 72.8697° E", status: "Active", alerts: 12, uptime: "99.8%" },
  { id: "CAM-02", name: "Worli Sea Link", location: "19.0330° N, 72.8158° E", status: "Active", alerts: 4, uptime: "100%" },
  { id: "CAM-03", name: "Gateway of India", location: "18.9220° N, 72.8347° E", status: "Offline", alerts: 0, uptime: "84.2%" },
  { id: "CAM-04", name: "Juhu Beach Jn", location: "19.1000° N, 72.8267° E", status: "Active", alerts: 23, uptime: "99.5%" },
];

export default function CamerasPage() {
  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-h2">Camera Management</h1>
          <p className="text-[16px] text-body mt-2 leading-[1.7]">Monitor and configure surveillance nodes across the network.</p>
        </div>
        <Button className="px-6 py-3 shadow-xl shadow-brand/20">
          <Plus className="w-5 h-5 mr-2" />
          Add Node
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {cameras.map((cam) => (
          <GlassCard key={cam.id} className="relative group hover:border-brand/40 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110 shadow-lg",
                  cam.status === 'Active' 
                    ? 'bg-brand-softer border-brand/30 text-brand shadow-brand/10' 
                    : 'bg-glass-bg border-glass-border text-body-subtle shadow-black/10'
                )}>
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-heading group-hover:text-brand transition-colors">{cam.name}</h3>
                  <p className="text-[14px] text-body-subtle flex items-center gap-1.5 mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    {cam.location}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  cam.status === 'Active' 
                    ? 'bg-brand-softer border-brand/20 text-brand' 
                    : 'bg-glass-bg border-glass-border text-body-subtle'
                )}>
                  <span className="flex items-center gap-1.5">
                    <Circle className={cn("w-2 h-2 fill-current", cam.status === 'Active' ? 'animate-pulse' : '')} />
                    {cam.status}
                  </span>
                </span>
                <span className="text-[12px] text-body font-mono font-bold px-2 py-1 rounded-lg bg-glass-bg border border-glass-border-subtle">{cam.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { label: "Uptime", value: cam.uptime, icon: Activity },
                { label: "Alerts (24h)", value: cam.alerts, icon: ShieldAlert, color: cam.alerts > 15 ? 'text-danger' : 'text-heading' },
                { label: "Config", value: "Manage Zones", icon: Settings2, action: true },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-[10px] text-body-subtle font-bold uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <stat.icon className="w-3 h-3" />
                    {stat.label}
                  </span>
                  {stat.action ? (
                    <button className="text-[14px] font-bold text-brand hover:underline mt-2 text-left transition-all">
                      {stat.value}
                    </button>
                  ) : (
                    <span className={cn("text-[16px] font-bold mt-2", stat.color || 'text-heading')}>{stat.value}</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-glass-border-subtle flex gap-3">
              <Button variant="secondary" className="flex-1 py-3 font-bold text-[13px] uppercase tracking-wider">
                View Live Stream
              </Button>
              <Button variant="secondary" className="px-4 py-3">
                <Settings2 className="w-5 h-5" />
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
