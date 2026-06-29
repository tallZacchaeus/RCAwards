"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  children,
  id,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  children?: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink transition-colors hover:border-gold/40 has-[[data-state=checked]]:border-gold/60 has-[[data-state=checked]]:bg-gold/5"
    >
      <RadioGroupPrimitive.Item
        id={id}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gold/50 outline-none transition-colors data-[state=checked]:border-gold focus-visible:ring-2 focus-visible:ring-gold/40",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="h-2 w-2 rounded-full bg-gold" />
      </RadioGroupPrimitive.Item>
      {children}
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
