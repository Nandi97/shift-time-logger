'use client';
import React from 'react';

/**
 * Works with cheap USB barcode scanners (keyboard wedge). Most scanners type the code then Enter.
 * - Auto focuses on mount and after submit.
 * - Pressing Enter calls onScan(value) and clears the field.
 */
export function ScannerInput({
  onScan,
  placeholder = 'Scan barcode or type and press Enter'
}: {
  onScan: (code: string) => void;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <input
      ref={ref}
      className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const value = (e.currentTarget as HTMLInputElement).value.trim();
          if (value) {
            onScan(value);
            (e.currentTarget as HTMLInputElement).value = '';
            ref.current?.focus();
          }
        }
      }}
    />
  );
}
