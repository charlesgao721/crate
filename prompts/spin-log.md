Read PLAN.md first. Build ONLY feature 9 (Spin log).

- Create the plays table exactly as in PLAN.md section 3 (id, user_id, record_id, played_on, note). Deleting a record also deletes its plays.
- On the record detail page: a "Log a spin" form (date defaults to today, optional note) and a list of past spins for that record, newest first.
- Each record card on My Collection shows its play count.
- Add a "Most played" option to the existing sort dropdown on My Collection.
- Keep data isolation (a user can only log spins on their own records) and use parameterized SQL.

Do not build any other feature, and do not change the dashboard stats.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/spin-log.md with this prompt word for word plus a summary and any problems you hit.

## Summary

Added the shared `plays` table with the requested columns, ownership constraints, and cascading record deletion. Record detail pages now accept spin entries with a date and optional note, and display the log newest first. Collection cards show spin counts, and the collection sort dropdown includes Most played.

All play reads and writes are scoped to the signed-in user's id; inserts also confirm record ownership and use bound SQL parameters.

Problems hit: the initial composite foreign key for plays could not reference records because the existing records table has no matching composite unique constraint. The plays table now references record ids directly with delete cascade, while the logging route checks that the record belongs to the signed-in user before inserting.
