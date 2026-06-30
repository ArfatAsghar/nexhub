"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg animate-scale-in",
          // Glass panel surface
          "rounded-2xl border border-white/[0.08] bg-canvas-raised shadow-overlay",
          // Top accent line
          "overflow-hidden",
          className,
        )}
      >
        {/* Top glow accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="p-6">
          {title && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-white/8 transition-all duration-150"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}