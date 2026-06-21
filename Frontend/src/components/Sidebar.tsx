"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Upload, 
  Camera, 
  BarChart3, 
  Settings,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Violations", href: "/violations", icon: AlertTriangle },
  { name: "Process Image", href: "/process", icon: Upload },
  { name: "Cameras", href: "/cameras", icon: Camera },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen glass-surface border-r-0 fixed left-0 top-0 hidden md:flex flex-col z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-softer flex items-center justify-center border border-brand/30">
          <ShieldCheck className="text-brand w-6 h-6" />
        </div>
        <h1 className="text-xl font-medium text-heading tracking-tight">Gridlock AI</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-base transition-all duration-200 group",
                isActive 
                  ? "bg-[#1E293B] text-brand border border-glass-border shadow-sm" 
                  : "text-body hover:bg-glass-bg-hover hover:text-heading"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-brand" : "text-body group-hover:text-heading"
              )} />
              <span className="text-[14px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-glass-border-subtle">
        <div className="glass-surface relative bg-brand-softer p-4 rounded-base border-brand/10">
          <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-sm font-medium text-heading">All Systems Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
