Read PLAN.md first. Build ONLY feature 5 (Stars).

- Create the stars table exactly as in PLAN.md section 3: one table for all users, each row has id, user_id, record_id and created_at, and the pair (user_id, record_id) is unique.
- A star toggle on each record card and on the record detail page (filled burnt-orange star when starred, outline when not). Clicking it adds or removes the row.
- A "Starred" page, linked in the header, listing only the logged-in user's starred records.
- Deleting a record also deletes its stars.
- Keep data isolation: a user can only star their own records.

Do not build search, the dashboard or any other feature.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/stars.md with this prompt word for word plus a summary and any problems you hit, and confirm that stars is a single shared junction table, not one table per user.

## Summary

Created one shared PostgreSQL `stars` junction table with `id`, `user_id`, `record_id`, and `created_at`, plus a unique constraint on `(user_id, record_id)`. Its foreign keys cascade on user or record deletion. Record cards and detail pages use a CSRF-protected toggle; `/starred` lists only the logged-in user's records and is linked in the header.

The toggle route verifies record ownership and scopes star reads and deletes by the logged-in user's id. No search or dashboard work was included.

Problems hit: none.
