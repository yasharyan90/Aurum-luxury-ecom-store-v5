// src/lib/orderStatus.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for order status metadata.
// Used by: AdminPage, MyOrdersPage, TrackOrderPage.
// Keeping this in one file means the status list, colors, labels,
// icons, and step order can never drift out of sync between the
// owner dashboard and the customer-facing pages again.
// ─────────────────────────────────────────────────────────────

export const ORDER_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export const STATUS_CONFIG = {
  paid: {
    label: 'Confirmed',
    short: 'Paid',
    color: '#3B82F6',
    bg:    '#EFF5FF',
    bgDark:'rgba(59,130,246,0.12)',
    icon:  '✓',
    step:  1,
    description: 'Payment received — your order is confirmed and being prepared.',
  },
  processing: {
    label: 'Processing',
    short: 'Processing',
    color: '#D97706',
    bg:    '#FFF8EF',
    bgDark:'rgba(217,119,6,0.12)',
    icon:  '⚙',
    step:  2,
    description: 'Our artisans are carefully preparing and packaging your order.',
  },
  shipped: {
    label: 'Shipped',
    short: 'Shipped',
    color: '#8B5CF6',
    bg:    '#F5F0FF',
    bgDark:'rgba(139,92,246,0.12)',
    icon:  '✈',
    step:  3,
    description: 'Your order is on its way to you.',
  },
  delivered: {
    label: 'Delivered',
    short: 'Delivered',
    color: '#27AE60',
    bg:    '#EDFFF4',
    bgDark:'rgba(39,174,96,0.12)',
    icon:  '✦',
    step:  4,
    description: 'Delivered. We hope you love your AURUM piece.',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    color: '#C0392B',
    bg:    '#FFF5F5',
    bgDark:'rgba(192,57,43,0.12)',
    icon:  '✕',
    step:  0,
    description: 'This order has been cancelled.',
  },
  // Fallback for any legacy/unexpected status value already in the DB
  pending: {
    label: 'Pending',
    short: 'Pending',
    color: '#D97706',
    bg:    '#FFF8EF',
    bgDark:'rgba(217,119,6,0.12)',
    icon:  '⏳',
    step:  1,
    description: 'Awaiting payment confirmation.',
  },
};

export const TRACKING_STEPS = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.paid;
}

// Returns a CSS background string appropriate for the current theme.
// Pass isDark from useTheme() — falls back to light bg if omitted.
export function getStatusBg(status, isDark = false) {
  const cfg = getStatusConfig(status);
  return isDark ? cfg.bgDark : cfg.bg;
}
