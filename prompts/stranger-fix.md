Bug from a user test, please fix FAST (I have about 20 minutes before my deadline) and keep the change small. No database schema changes.

Genres are case-sensitive, so one genre splits into two. A tester typed "Jazz" on one record and "jazz" on another. The collection genre filter, the Dashboard "Records by genre" chart and the /spin genre picker all treated them as two genres, and filtering by "Jazz" hid the "jazz" record.

Fix:
1. On create and edit, trim the genre, and if the signed-in user already has a record whose genre matches case-insensitively, save it with that existing spelling (same idea as how artists already merge).
2. Everywhere genres are listed, filtered or grouped (collection filter options and filtering, the dashboard query and computeStats genre counts, the spin page picker and random pick), compare case-insensitively so existing mixed-case data also merges. Show one spelling per genre.
3. Run npm test; both existing tests must still pass. Quickly verify Jazz/jazz now shows as one genre.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/stranger-fix.md with this prompt word for word plus a short summary.

## Summary

Create/edit now reuse the first existing spelling for a matching user genre. Collection filtering, genre option lists, dashboard counts, and Random pick compare trimmed genre names case-insensitively; grouped lists show one spelling per genre. Added a dashboard regression test for mixed-case genre counts. No schema changes.
