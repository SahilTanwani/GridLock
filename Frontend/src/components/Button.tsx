"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "secondary" | "tertiary" | "success" | "danger" | "warning" | "dark" | "ghost";
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  children: React.ReactNode;
}

export function Button({ 
  variant = "brand", 
  size = "base", 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-base border border-transparent disabled:cursor-not-allowed disabled:bg-glass-bg disabled:text-body-subtle disabled:shadow-none";
  
  const variants = {
    brand: "bg-brand text-[#060A12] hover:bg-brand-strong focus:ring-4 focus:ring-brand/40 glint-effect",
    secondary: "bg-glass-bg border-glass-border text-heading hover:bg-glass-bg-hover focus:ring-4 focus:ring-glass-border glint-effect",
    tertiary: "bg-glass-bg/50 border-glass-border-subtle text-body hover:bg-glass-bg hover:text-heading focus:ring-4 focus:ring-glass-border glint-effect",
    success: "bg-success text-white hover:bg-success-strong focus:ring-4 focus:ring-success/40 glint-effect",
    danger: "bg-danger text-white hover:bg-danger-strong focus:ring-4 focus:ring-danger/40 glint-effect",
    warning: "bg-warning text-white hover:bg-warning-strong focus:ring-4 focus:ring-warning/40 glint-effect",
    dark: "bg-[#0F172A] text-white hover:bg-[#1E293B] focus:ring-4 focus:ring-glass-border glint-effect",
    ghost: "bg-transparent border-transparent text-heading hover:bg-glass-bg-hover shadow-none",
  };

  const sizes = {
    xs: "text-[12px] px-3 py-1.5",
    sm: "text-[14px] px-3 py-2",
    base: "text-[14px] px-4 py-2.5",
    lg: "text-[16px] px-5 py-3",
    xl: "text-[16px] px-6 py-3.5",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
