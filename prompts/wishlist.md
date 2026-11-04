Read PLAN.md first. Build ONLY feature 10 (Wishlist). Please be fast; I have about 30 minutes before my deadline, so keep it simple and verify quickly.

- Add is_wishlist (boolean, default false) to the records table in db/schema.sql and the development database (idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
- The add/edit form gets an "I don't own this yet (wishlist)" checkbox.
- A Wishlist page, linked in the header, lists only the signed-in user's wishlist records, each with a "Got it!" button that moves it into the collection (sets is_wishlist to false).
- My Collection, the dashboard stats query and Random pick must ignore wishlist records.
- Keep data isolation and parameterized SQL.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/wishlist.md with this prompt word for word plus a short summary and any problems you hit.

## Summary

Added `is_wishlist` as a non-null boolean defaulting to false in `db/schema.sql` and the development database. The add/edit form saves it, the signed-in user's Wishlist page displays matching records with a “Got it!” action, and My Collection, dashboard stats, and Random pick exclude wishlist items.

Problems hit: one patch needed to be split because its hunks were out of order, and the first manual smoke-test script had a variable-name typo. Both were corrected; the app checks then passed.
