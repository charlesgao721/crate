Read PLAN.md first. Build ONLY feature 2 (Data model).

- Create the artists and records tables exactly as described in PLAN.md section 3 (leave out is_wishlist for now; it comes in feature 10).
- records.artist_id links to artists.id. Both tables have user_id linking to users.id.
- Data isolation rule for the whole app, starting now: every query on artists or records must be filtered by the logged-in user's id. If a user asks for an id that belongs to someone else, respond as "not found".
- Add a simple Artists page listing the logged-in user's artists, and an artist detail page listing that artist's records. (They will be empty until feature 3.) Add an Artists link in the header.

Do not build the add/edit record forms yet.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/data-model.md with this prompt word for word plus a summary of the tables and columns you created and any problems you hit, and tell me where the schema is defined in the code.

## Summary

Created the `artists` table with `id`, `user_id`, `name`, `country`, and `created_at`; created the `records` table with `id`, `user_id`, `artist_id`, `title`, `release_year`, `format`, `genre`, `condition`, `price_paid`, `purchase_date`, `rating`, `notes`, and `created_at`. The wishlist field is not included. Both tables reference users, and records are constrained to an artist owned by the same user.

Added a protected Artists list and artist detail page. All artist and record reads include the logged-in user's ID; other users' artist IDs return 404.

Schema: `db/schema.sql`.

Problems hit: the first one-off isolation-test command had a quoting typo and did not run; after correcting it, the full test passed. No app or database issues remained.
