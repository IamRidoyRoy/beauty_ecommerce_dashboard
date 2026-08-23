# Beauty E-commerce Management Dashboard

Production-oriented React management dashboard for the Django REST Framework Beauty E-commerce platform.

## Stack

React, TypeScript, Vite, Redux Toolkit, RTK Query, React Router, Tailwind CSS v4, Lucide React and Recharts.

## Current management coverage

- Dashboard KPIs, revenue/order/customer/product charts and operational panels
- Catalog: simple + variable products, edit workflow, variants, categories, brands, attributes, shades and image galleries
- Rich-text Product Description editor
- Inventory: stock, warehouses, movements, adjustments and transfers
- Procurement: suppliers, purchases, approval and partial/full receiving
- Sales: searchable orders, order detail, invoice view and print invoice, payments and shipments
- Customers: searchable commercial metrics and account history
- Delivery Areas: modules, districts and thana overrides
- Marketing: coupons, promotions and campaigns
- After Sales: reviews, returns and refunds
- Reports with date presets/custom dates, charts, immediate Excel-compatible download and queued XLSX exports
- Staff/RBAC and checkout settings
- Global operational search

## Important product behavior

Simple products do not require variants. The creation wizard collects the simple-product SKU before the first product API create request, preventing the previous `SKU is required for simple products` error.

Variable products generate real combinations from configurable Attribute/AttributeValue records. They remain draft until an active variant exists.

## Environment

```bash
cp .env.example .env
```

Example local API:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Example LAN API:

```env
VITE_API_URL=http://192.168.0.104:8000/api/v1
```

## Run

```bash
npm install
npm run dev
```

Vite listens on `0.0.0.0:5173` in this project.

## Release validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Required backend compatibility

Use the companion upgraded backend delivered with this dashboard. It adds/aligns:

- `/api/v1/admin/dashboard/`
- `/api/v1/admin/global-search/`
- management beauty taxonomy APIs
- inventory resolve/threshold/filter/search APIs
- customer commercial metrics and status action
- order search/date/courier filters
- management search across payments, shipments, returns, refunds and reviews
- report response/date-range fixes
- Celery-generated real `.xlsx` report exports (requires `openpyxl`)

## LAN CORS

Django must use full origins for CORS:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.104:5173",
]
```

`ALLOWED_HOSTS` uses hostnames/IPs without `http://`.

## Product images

Product Create/Edit → **Images** supports multiple uploads with previews, reorder controls and one explicit **Feature Image**. The Feature Image is submitted as `primary_index` and is used by the customer storefront as the product-card image and the first product-detail gallery image.

Catalog → **Product Images** also allows managing existing base-product or variant galleries, changing the Feature/Primary image, alt text, order and deleting images.

## Product media

Uploaded product images are returned by Django as `/media/...` paths. The dashboard resolves them against `VITE_MEDIA_BASE_URL`, or automatically against the origin of `VITE_API_URL` when that variable is omitted. For LAN testing use the same host for both, for example:

```env
VITE_API_URL=http://192.168.0.104:8000/api/v1
VITE_MEDIA_BASE_URL=http://192.168.0.104:8000
```

The product editor now loads the existing base-product gallery in the Images step, including Feature Image selection, reorder and delete controls.

## Warehouse & notification behavior

- Warehouse management uses the backend's persisted fields: name, code, address and active status.
- Name and code are required in the dashboard before submitting.
- API validation errors are shown at the affected field and in a concise toast.
- Success/info notifications close automatically after 3.5 seconds; error notifications after 5 seconds. Identical duplicate notifications are de-duplicated.

## Homepage hero slider

Open **Marketing → Hero Slider** to create, edit, activate/hide, schedule and delete storefront hero slides. Each slide supports desktop/mobile images, text theme/position, overlay, CTA links and display order.
