import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function GlassCard({ children, className, title, subtitle }: GlassCardProps) {
  return (
    <div className={cn("glass-surface relative rounded-base p-6", className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-medium text-heading">{title}</h3>}
          {subtitle && <p className="text-sm text-body mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
