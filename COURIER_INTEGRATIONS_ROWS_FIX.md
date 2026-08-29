# Courier Integrations response-shape fix

The Courier Integrations page now normalizes list responses through `rowsOf()` and no longer assumes the API response itself is always an array. This prevents `rows.map is not a function` when DRF pagination or an API envelope is enabled.
