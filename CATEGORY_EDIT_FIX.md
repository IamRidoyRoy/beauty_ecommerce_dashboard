# Category edit fix

- Generic CRUD forms now submit only declared form fields.
- Editing a category no longer sends hidden `image: null` or `seo` values.
- Category order uses explicit priority: 1, 2, 3... first; 0/unset last.
- Parent category options and category list use the same priority rule.
