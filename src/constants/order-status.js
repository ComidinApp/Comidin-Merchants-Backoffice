export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  DELIVERED: "delivered",
  CLAIMED: "claimed",
  CANCELLED: "cancelled",
  RESOLVED: "resolved",
});

export const ORDER_STATUS_OPTIONS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CLAIMED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RESOLVED,
];

export const ORDER_STATUS_LABEL_ES = Object.freeze({
  [ORDER_STATUS.PENDING]: "Pendiente",
  [ORDER_STATUS.CONFIRMED]: "Confirmado",
  [ORDER_STATUS.COMPLETED]: "Completado",
  [ORDER_STATUS.DELIVERED]: "Entregado",
  [ORDER_STATUS.CLAIMED]: "Reclamado",
  [ORDER_STATUS.CANCELLED]: "Cancelado",
  [ORDER_STATUS.RESOLVED]: "Resuelto",
});

export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.CLAIMED],
  [ORDER_STATUS.CLAIMED]: [ORDER_STATUS.RESOLVED],
  [ORDER_STATUS.CANCELLED]: [],
});

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABEL_ES[status] ?? String(status ?? "");
}

export function getAllowedNextStatuses(currentStatus) {
  return ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function isAllowedTransition(from, to) {
  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

// MUI-ish color intent (ajustalo a tu componente de Label/Chip)
export function getOrderStatusColor(status) {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return "warning";
    case ORDER_STATUS.CONFIRMED:
      return "info";
    case ORDER_STATUS.COMPLETED:
      return "success";
    case ORDER_STATUS.DELIVERED:
      return "primary";
    case ORDER_STATUS.CLAIMED:
      return "secondary";
    case ORDER_STATUS.CANCELLED:
      return "error";
    case ORDER_STATUS.RESOLVED:
      return "success";
    default:
      return "default";
  }
}

export function formatTransitionError(from, to) {
  const fromLabel = getOrderStatusLabel(from);
  const toLabel = getOrderStatusLabel(to);
  const allowed = getAllowedNextStatuses(from).map(getOrderStatusLabel);

  if (!allowed.length) {
    return `No se puede cambiar el estado. El pedido está en "${fromLabel}" y no permite transiciones.`;
  }

  return `No se puede cambiar el estado de "${fromLabel}" a "${toLabel}". Transiciones permitidas: ${allowed.join(
    ", "
  )}.`;
}

export function normalizeOrderStatus(status) {
  // Por si el backend manda MAYUS o algo raro
  if (!status) return status;
  return String(status).trim().toLowerCase();
}
