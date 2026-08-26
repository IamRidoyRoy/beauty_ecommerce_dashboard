# Order workflow update

This build updates the dashboard order workflow:

- Sales remains the second sidebar module after Dashboard.
- Create Order is available from the Orders page button, not as a separate navigation item.
- Staff can explicitly choose Existing customer or New customer.
- Existing-customer search returns a preferred saved delivery address for prefill.
- District and Thana use searchable dependent selectors and remain editable.
- Required Create Order fields display a red `*`.
- Product/variant management responses expose sellable stock for immediate quantity validation.
- The backend revalidates stock again before creating/reserving the order.
- Order item snapshot images use stable `/media/...` paths.
- Dashboard Order Detail and Invoice resolve media paths through `VITE_MEDIA_BASE_URL` / the API origin.
- Invoice printing hides dashboard chrome.
