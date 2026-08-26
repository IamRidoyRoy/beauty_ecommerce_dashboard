# Dashboard release

- User-facing currency renders with the Bangladeshi Taka sign (`৳`) instead of `BDT`.
- Category priority remains `1 = first`, `2 = second`, etc.; `0 = unprioritized`.
- Backend now resequences sibling priorities so duplicate priority positions cannot make the storefront fall back to alphabetical order.
