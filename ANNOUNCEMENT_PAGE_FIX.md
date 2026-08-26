# Announcement page fix

The page now surfaces the backend error returned by the Announcement Messages API instead of a generic blank/error card.

If the backend says the AnnouncementMessage table does not exist, run:

```bash
cd beauty_ecommerce_backend/backend
python manage.py setup_storefront_controls --seed
```
