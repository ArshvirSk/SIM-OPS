"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

export function Slider({ className, value = [0], onValueChange, ...props }: SliderProps) {
  return (
    <input
      {...props}
      type="range"
      value={value[0] ?? 0}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn("h-2 w-full cursor-pointer accent-primary", className)}
    />
  );
}
