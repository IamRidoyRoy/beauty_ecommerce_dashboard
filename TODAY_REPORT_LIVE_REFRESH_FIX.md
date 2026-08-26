# Today Sales / Revenue Live Refresh Fix

- Dashboard KPI and commercial report queries refetch on mount, focus and reconnect.
- Dashboard/Sales reports poll every 20 seconds so orders placed on the customer storefront appear without a hard browser reload.
- Dashboard-side order, payment, shipment, return and refund mutations invalidate Dashboard + Reports cache tags.
