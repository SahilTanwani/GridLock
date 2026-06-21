"use client";

import { GlassCard } from "@/components/GlassCard";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const violations = [
  { id: "VIO-8234", plate: "MH12 AB 1234", type: "Triple Riding", location: "Andheri Jn", time: "14:32:01", status: "Verified", confidence: "94.2%" },
  { id: "VIO-8235", plate: "DL03 CJ 5678", type: "No Helmet", location: "Saket Metro", time: "14:35:12", status: "Pending", confidence: "88.7%" },
  { id: "VIO-8236", plate: "KA05 CJ 9012", type: "Stop-line", location: "Indiranagar", time: "14:38:45", status: "Rejected", confidence: "91.5%" },
  { id: "VIO-8237", plate: "MH01 BK 4321", type: "Wrong-side", location: "Worli Sea Link", time: "14:42:10", status: "Verified", confidence: "96.1%" },
  { id: "VIO-8238", plate: "DL08 SL 1122", type: "No Seatbelt", location: "Connaught Place", time: "14:45:33", status: "Pending", confidence: "85.4%" },
];

export default function ViolationsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-h2">Violation Records</h1>
          <p className="text-[16px] text-body mt-2 leading-[1.7]">Browse and manage detected traffic violations.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-body-subtle group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="Search by plate..." 
              className="glass-surface relative bg-glass-bg/20 pl-11 pr-4 py-3 rounded-base text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </header>

      <GlassCard className="p-0 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-border-subtle bg-glass-bg/20">
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">ID</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Vehicle Plate</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Violation Type</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Location</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Time</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-5 text-[14px] font-bold text-heading uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border-subtle">
              {violations.map((violation) => (
                <tr key={violation.id} className="hover:bg-glass-bg-hover/30 transition-colors group">
                  <td className="px-6 py-5 text-sm text-body font-mono">{violation.id}</td>
                  <td className="px-6 py-5 text-[14px] font-bold text-heading">{violation.plate}</td>
                  <td className="px-6 py-5 text-sm text-body">
                    <span className="px-3 py-1 rounded-full bg-glass-bg border border-glass-border text-[12px] font-bold uppercase tracking-wider">
                      {violation.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-body">{violation.location}</td>
                  <td className="px-6 py-5 text-sm text-body-subtle font-medium">{violation.time}</td>
                  <td className="px-6 py-5 text-sm">
                    <div className="flex items-center gap-2">
                      {violation.status === "Verified" && <CheckCircle2 className="w-4 h-4 text-brand" />}
                      {violation.status === "Pending" && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      {violation.status === "Rejected" && <XCircle className="w-4 h-4 text-danger" />}
                      <span className={cn(
                        "text-[12px] font-bold uppercase tracking-wider",
                        violation.status === "Verified" ? "text-brand" : 
                        violation.status === "Pending" ? "text-amber-500" : 
                        "text-danger"
                      )}>
                        {violation.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-body font-medium">{violation.confidence}</td>
                  <td className="px-6 py-5 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="xs" className="p-2 border border-glass-border hover:border-brand/40">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="xs" className="p-2 border border-glass-border hover:border-brand/40">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-6 border-t border-glass-border-subtle bg-glass-bg/10 flex items-center justify-between">
          <p className="text-sm text-body-subtle font-medium">Showing 5 of 1,284 records</p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" disabled>Previous</Button>
            <Button variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
