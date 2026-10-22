import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StockStatusBadgeProps {
  stock: number;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ stock, size = 'sm', showIcon = true }) => {
  const isSm = size === 'sm';
  const iconClass = isSm ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0';

  if (stock <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full ${
        isSm ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-xs whitespace-nowrap`}>
        {showIcon && <XCircle className={iconClass} />}
        <span>Agotado</span>
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full ${
        isSm ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs whitespace-nowrap`}>
        {showIcon && <AlertTriangle className={iconClass} />}
        <span>Por Agotarse</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${
      isSm ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    } bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-xs whitespace-nowrap`}>
      {showIcon && <CheckCircle2 className={iconClass} />}
      <span>Disponible</span>
    </span>
  );
};

export const StockQuantityPill: React.FC<{ stock: number; unit?: string }> = ({ stock, unit = 'UND' }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
        <span>{stock} {unit}</span>
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>{stock} {unit}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
      <span>{stock} {unit}</span>
    </span>
  );
};
