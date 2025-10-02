import React, { ReactNode } from "react";

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Field({ label, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}