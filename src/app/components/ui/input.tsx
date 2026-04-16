"use client";

import * as React from "react";

import { cn } from "./utils";

/** Strip Figma inspector props — same pattern as `select.tsx` */
function filterFigmaProps<T extends Record<string, unknown>>(props: T): T {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith("_fg")),
  ) as T;
}

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "size"> & {
    /** Visual height — mirrors `SelectTrigger` `size`; avoids clashing with native `input` `size`. */
    fieldSize?: "sm" | "default";
  }
>(({ className, type, fieldSize = "default", ...props }, ref) => {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      data-size={fieldSize}
      className={cn(
        "flex w-full min-w-0 outline-none",
        "rounded-xl border border-neutral-200 bg-white px-4",
        "text-[15px] font-normal text-neutral-800",
        "placeholder:text-neutral-400",
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "data-[size=default]:h-10 data-[size=sm]:h-9 data-[size=sm]:text-sm data-[size=sm]:px-3",
        "hover:border-neutral-300",
        "focus-visible:border-[#003B95] focus-visible:ring-4 focus-visible:ring-[#003B95]/[0.08]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white disabled:text-neutral-400",
        "aria-invalid:border-red-300 aria-invalid:bg-white aria-invalid:ring-4 aria-invalid:ring-red-300/20",
        "file:inline-flex file:h-8 file:min-w-0 file:cursor-pointer file:rounded-lg file:border-0 file:px-3 file:text-sm file:font-medium file:text-neutral-800",
        className,
      )}
      {...cleanProps}
    />
  );
});
Input.displayName = "Input";

export { Input };
