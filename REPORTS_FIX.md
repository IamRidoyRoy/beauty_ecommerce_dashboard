# Reports loading fix

- Stabilizes report `start`/`end` query parameters with `useMemo` so RTK Query does not re-request continuously on every render.
- Uses date-only parameters accepted by the Django report selectors.
- Supports URL deep links (`?type=profit&period=today`) and custom From/To ranges.
- Shows the actual API error message rather than a blank/indefinite skeleton.
- Keeps Excel-now and queued XLSX exports.
