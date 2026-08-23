# Business Dashboard Upgrade

This build includes:

- Sales navigation moved directly after Dashboard.
- Soft active navigation styling for standalone sections.
- Invoice print mode hides dashboard chrome.
- Product and order-item images use `VITE_MEDIA_BASE_URL` / Django API origin.
- Product CSV/XLSX import with a downloadable CSV template.
- Clickable Dashboard KPIs with filtered destinations.
- Reports fixed to use stable request ranges plus preset/custom From/To filters.
- XLSX report export download URLs resolve through the configured Django media origin.

## Product import

Dashboard: **Catalog → Products → Import CSV/XLSX**.

Supported columns:

`name, product_type, sku, brand, category, base_price, compare_at_price, cost_price, barcode, weight, status, short_description, description, featured, new_arrival, bestseller, trending`

- `brand` and `category` may be existing IDs, names, or slugs.
- Simple products require `sku`.
- Variable products may omit SKU and are forced to Draft if imported as Active, because real variants must be created before publishing.

No model migration is required for this upgrade.
