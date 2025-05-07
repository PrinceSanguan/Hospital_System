"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    const id = React.useId()

    return (
      <div className="inline-flex items-center">
        <label
          htmlFor={id}
          className={cn(
            "relative h-6 w-11 cursor-pointer rounded-full transition-colors",
            props.disabled ? "cursor-not-allowed opacity-50" : "",
            props.checked || props.defaultChecked ? "bg-blue-600" : "bg-gray-200",
            className
          )}
        >
          <input
            type="checkbox"
            id={id}
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <span
            className={cn(
              "block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-md transition-transform",
              props.checked || props.defaultChecked ? "translate-x-5" : ""
            )}
          />
        </label>
        {label && (
          <span className="ml-2 text-sm">{label}</span>
        )}
      </div>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
