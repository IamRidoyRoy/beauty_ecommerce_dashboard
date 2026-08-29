# Homepage Content Blank Page Fix

The Homepage Content screen now normalizes list API responses before rendering.
It accepts direct arrays, DRF paginated `{results: [...]}` responses, and the project's `{success, data}` envelope.
This prevents runtime `object is not iterable` / `.map is not a function` failures when API pagination differs between environments.

No database migration is required for this fix itself. Existing Homepage Content migrations still need to be applied.
