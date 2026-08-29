# Settings card access behavior

All General Settings cards remain visible to staff who can open the General Settings page.

Each card checks its own granular permission:

- Existing customer verification -> `settings_general`
- Delivery pricing -> `courier_delivery_areas`
- Courier integrations -> `settings_courier_integrations`
- Payment gateways -> `settings_payment_gateways`
- Pixel & Tracking -> `settings_pixel_tracking`
- Branding & Theme -> `settings_branding`

When access is missing, the card stays visible with a `No access` badge and a disabled `No Access` action. Direct routes and backend APIs remain protected by their existing permission gates.
