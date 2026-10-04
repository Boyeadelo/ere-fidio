export const DELIVERY_STAGES = ["PAID", "PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const labels: Record<string, string> = {
  PENDING: "Payment pending", PAID: "Payment confirmed", PROCESSING: "Processing", PACKED: "Packed",
  SHIPPED: "Dispatched", DISPATCHED: "Dispatched", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};
export const orderStatusLabel = (status: string) => labels[status] || status.replaceAll("_", " ").toLowerCase();
export const normalizeDeliveryStatus = (status: string) => status === "SHIPPED" ? "DISPATCHED" : status;
