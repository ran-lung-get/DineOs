import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: "bottom" | "right";
  className?: string;
  maxWidth?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "bottom",
  className,
  maxWidth = "max-w-xl",
}: DrawerProps) {
  const isBottom = position === "bottom";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <div
            className={cn(
              "fixed inset-0 pointer-events-none flex",
              isBottom ? "items-end justify-center" : "items-stretch justify-end"
            )}
          >
            <motion.div
              initial={isBottom ? { y: "100%" } : { x: "100%" }}
              animate={isBottom ? { y: 0 } : { x: 0 }}
              exit={isBottom ? { y: "100%" } : { x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={cn(
                "pointer-events-auto w-full bg-white shadow-2xl overflow-hidden flex flex-col z-10",
                isBottom
                  ? "rounded-t-3xl max-h-[90vh] md:max-h-[85vh]"
                  : "h-full",
                maxWidth,
                className
              )}
            >
              {/* Drag Handle (for bottom drawer) */}
              {isBottom && (
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>
              )}

              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                  {typeof title === "string" ? (
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                  ) : (
                    title
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
