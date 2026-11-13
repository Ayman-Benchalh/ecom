import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-xs",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        morocco:
          "border-transparent bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold tracking-wide uppercase shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
