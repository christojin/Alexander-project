/** Withdrawal method labels (Spanish) */
export const withdrawalMethodLabels: Record<string, string> = {
  qr_bolivia: "QR Bolivia",
  bank_transfer: "Transferencia Bancaria",
  binance_pay: "Binance Pay",
};

/** Withdrawal status labels (Spanish) */
export const withdrawalStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
};

/** Withdrawal status color classes */
export const withdrawalStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

/** Valid withdrawal methods */
export const VALID_WITHDRAWAL_METHODS = [
  "qr_bolivia",
  "bank_transfer",
  "binance_pay",
] as const;
