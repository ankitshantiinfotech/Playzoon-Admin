"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "./utils";

// Helper to filter Figma inspector props (_fg*) from reaching DOM elements
function filterFigmaProps<T extends Record<string, unknown>>(props: T): T {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith("_fg")),
  ) as T;
}

function FilteredChevronDown(props: React.ComponentProps<typeof ChevronDown>) {
  return <ChevronDown {...filterFigmaProps(props)} />;
}

function FilteredChevronUp(props: React.ComponentProps<typeof ChevronUp>) {
  return <ChevronUp {...filterFigmaProps(props)} />;
}

function FilteredCheck(props: React.ComponentProps<typeof Check>) {
  return <Check {...filterFigmaProps(props)} />;
}

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
  }
>(function SelectTriggerInner(
  { className, size = "default", children, ...props },
  ref,
) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 whitespace-nowrap",
        "rounded-xl border border-neutral-200 px-4",
        "text-[15px] font-normal text-neutral-800",
        "data-[placeholder]:text-neutral-400",
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "outline-none",
        "data-[size=default]:h-10 data-[size=sm]:h-9",
        "hover:border-neutral-300",
        "focus:border-[#003B95] focus:bg-white focus:ring-4 focus:ring-[#003B95]/[0.08]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50 disabled:text-neutral-400",
        "aria-invalid:border-red-300 aria-invalid:bg-red-50 aria-invalid:ring-4 aria-invalid:ring-red-300/20",
        "[&_svg:not([class*='text-'])]:text-neutral-400",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        className,
      )}
      {...cleanProps}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <FilteredChevronDown className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContentInner(
  { className, children, position = "popper", ...props },
  ref,
) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        data-slot="select-content"
        className={cn(
          "relative z-50 bg-white text-neutral-800",
          "rounded-xl border border-neutral-200 shadow-2xl",
          "max-h-[300px] min-w-[8rem] overflow-x-hidden overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...cleanProps}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1.5",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabelInner({ className, ...props }, ref) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.Label
      ref={ref}
      data-slot="select-label"
      className={cn(
        "px-2.5 py-1.5 text-xs font-medium text-neutral-400 tracking-wide uppercase",
        className,
      )}
      {...cleanProps}
    />
  );
});
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItemInner({ className, children, ...props }, ref) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2.5",
        "rounded-lg py-2.5 pr-8 pl-2.5",
        "text-sm text-neutral-700 outline-none",
        "focus:bg-[#003B95]/5 focus:text-neutral-900",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        "[&_svg:not([class*='text-'])]:text-neutral-400",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...cleanProps}
    >
      <span className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <FilteredCheck className="size-4 text-[#003B95]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = "SelectItem";

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(function SelectScrollUpButtonInner({ className, ...props }, ref) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5 text-neutral-400",
        className,
      )}
      {...cleanProps}
    >
      <FilteredChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(function SelectScrollDownButtonInner({ className, ...props }, ref) {
  const cleanProps = filterFigmaProps(props as Record<string, unknown>);
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5 text-neutral-400",
        className,
      )}
      {...cleanProps}
    >
      <FilteredChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
