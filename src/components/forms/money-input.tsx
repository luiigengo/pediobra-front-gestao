"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { centsToDecimalString, decimalStringToCents } from "@/lib/formatters";

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  valueCents: number;
  onChangeCents: (cents: number) => void;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ valueCents, onChangeCents, className, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() =>
      centsToDecimalString(valueCents),
    );

    React.useEffect(() => {
      const currentCents = decimalStringToCents(display);
      if (currentCents !== valueCents) {
        setDisplay(centsToDecimalString(valueCents));
      }
    }, [valueCents]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div className={cn("relative", className)}>
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
          R$
        </span>
        <Input
          ref={ref}
          inputMode="decimal"
          className="pl-9 font-mono"
          placeholder="0,00"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d,\.]/g, "");
            setDisplay(raw);
            onChangeCents(decimalStringToCents(raw));
          }}
          onBlur={() => setDisplay(centsToDecimalString(valueCents))}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = "MoneyInput";
