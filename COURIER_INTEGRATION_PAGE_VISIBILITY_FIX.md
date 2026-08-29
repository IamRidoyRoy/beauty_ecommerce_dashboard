# Courier Integration Page Visibility Fix

The Courier Integrations route existed, but the dashboard permission map only exposed `courier_gateways` to `super_admin` and `admin`.

Fixed behavior:
- `super_admin`, `admin`, and `manager` can open `/settings/courier-integrations`.
- Backend courier configuration API grants the same roles access, preventing a frontend-visible/backend-403 mismatch.
- Settings now includes a direct **Manage Courier Integrations** card.
- Sidebar remains under **Settings → Courier Integrations**.

After deployment, rebuild/restart the dashboard and hard-refresh the browser if an older Vite bundle is cached.
