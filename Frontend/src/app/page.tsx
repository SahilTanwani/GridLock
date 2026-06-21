"use client";

import { GlassCard } from "@/components/GlassCard";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Button } from "@/components/Button";

const stats = [
  { 
    name: "Total Violations", 
    value: "1,284", 
    change: "+12.5%", 
    trend: "up", 
    icon: AlertTriangle,
    color: "text-amber-500"
  },
  { 
    name: "Verified Records", 
    value: "942", 
    change: "+8.2%", 
    trend: "up", 
    icon: CheckCircle2,
    color: "text-brand"
  },
  { 
    name: "Pending Review", 
    value: "342", 
    change: "-4.1%", 
    trend: "down", 
    icon: Clock,
    color: "text-body-subtle"
  },
  { 
    name: "Success Rate", 
    value: "98.4%", 
    change: "+0.4%", 
    trend: "up", 
    icon: TrendingUp,
    color: "text-blue-500"
  },
];

const chartData = [
  { name: "Mon", violations: 45, accuracy: 94 },
  { name: "Tue", violations: 52, accuracy: 96 },
  { name: "Wed", violations: 38, accuracy: 95 },
  { name: "Thu", violations: 65, accuracy: 98 },
  { name: "Fri", violations: 48, accuracy: 97 },
  { name: "Sat", violations: 72, accuracy: 99 },
  { name: "Sun", violations: 58, accuracy: 98 },
];

export default function Dashboard() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="heading-h1">System Overview</h1>
        <p className="text-[20px] text-body leading-[1.7] mt-4 max-w-[70ch]">
          Real-time traffic monitoring and automated violation analytics powered by YOLOv8.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <GlassCard key={stat.name} className="relative group hover:border-brand/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className={stat.color}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center text-[12px] font-bold ${stat.trend === 'up' ? 'text-brand' : 'text-danger'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[14px] text-body font-medium uppercase tracking-wider">{stat.name}</p>
              <p className="text-3xl font-bold text-heading mt-2">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard 
          className="lg:col-span-2" 
          title="Violation Trends" 
          subtitle="Weekly distribution of detected violations"
        >
          <div className="h-[300px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--body-subtle)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--body-subtle)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(6, 10, 18, 0.95)', 
                    borderColor: 'var(--glass-border)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--glass-shadow)',
                    border: '1px solid var(--glass-border)'
                  }}
                  itemStyle={{ color: 'var(--heading)', fontSize: '14px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar 
                  dataKey="violations" 
                  fill="var(--brand)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Detection Accuracy" subtitle="Model performance over time">
          <div className="h-[300px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--body-subtle)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  domain={[90, 100]}
                  stroke="var(--body-subtle)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(6, 10, 18, 0.95)', 
                    borderColor: 'var(--glass-border)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--glass-shadow)',
                    border: '1px solid var(--glass-border)'
                  }}
                  itemStyle={{ color: 'var(--heading)', fontSize: '14px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="var(--brand)" 
                  fillOpacity={1} 
                  fill="url(#colorAcc)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard title="Recent Activity">
          <div className="space-y-6 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-glass-bg border border-glass-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-glass-bg-hover flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-body-subtle group-hover:text-amber-500 transition-colors" />
                   </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[16px] font-medium text-heading">MH12 AB 1234 — Triple Riding</h4>
                    <span className="text-[12px] text-body-subtle">2 mins ago</span>
                  </div>
                  <p className="text-[14px] text-body mt-1">Camera: ANDHERI_JN_04 • Confidence: 94.2%</p>
                </div>
                <Button variant="ghost" size="xs" className="bg-brand-softer border-brand/20 text-brand text-[10px] font-bold uppercase tracking-wider group-hover:bg-brand group-hover:text-[#060A12]">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Violation Distribution" subtitle="By violation category">
          <div className="space-y-6 mt-6">
            {[
              { label: "Helmet Non-compliance", count: 423, color: "bg-brand" },
              { label: "Stop-line Violation", count: 284, color: "bg-sky-400" },
              { label: "Wrong-side Driving", count: 156, color: "bg-purple-400" },
              { label: "Triple Riding", count: 124, color: "bg-amber-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[14px] mb-2">
                  <span className="text-heading font-medium">{item.label}</span>
                  <span className="text-body-subtle font-medium">{item.count} detections</span>
                </div>
                <div className="h-2 w-full bg-glass-bg/50 rounded-full overflow-hidden border border-glass-border-subtle">
                  <div 
                    className={`h-full ${item.color} rounded-full shadow-[0_0_10px_rgba(138,255,196,0.3)]`} 
                    style={{ width: `${(item.count / 1000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
