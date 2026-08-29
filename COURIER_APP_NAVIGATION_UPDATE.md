# Courier App Navigation Update

The operational courier modules are now separated from Sales into a dedicated top-level **Courier** app.

## New navigation

- Courier → Courier Orders (`/courier/orders`)
- Courier → Shipment Tracking (`/courier/shipments`)
- Courier → Delivery Areas (`/courier/delivery-areas`)

Legacy `/sales/courier`, `/sales/shipments`, and `/sales/delivery` URLs redirect to the new routes. The existing `shipping` module permission remains the access-control key.
