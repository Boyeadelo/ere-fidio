export const DELIVERY_STAGES = [
  "PAID",
  "PROCESSING",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const ADMIN_ORDER_STATUSES = [
  ...DELIVERY_STAGES,
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ADMIN_ORDER_STATUSES)[number] | "PENDING" | "SHIPPED";

const labels: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Payment confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Dispatched",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function orderStatusLabel(status: string) {
  return labels[status] || status.replaceAll("_", " ").toLowerCase();
}

export function normalizeDeliveryStatus(status: string) {
  return status === "SHIPPED" ? "DISPATCHED" : status;
}
