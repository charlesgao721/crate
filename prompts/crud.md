Read PLAN.md first. Build ONLY feature 3 (Create, read, update, delete).

- "Add record" form with: title, artist, release year, format (LP, EP, 7-inch, Box set), genre, condition (Mint, VG+, VG, G), price paid, purchase date, rating (1 to 5), notes.
- Artist field: type a name. If this user already has that artist, reuse it; otherwise create a new artist row for this user.
- My Collection page: grid of record cards (title, artist, year, rating).
- Clicking a card opens a detail page with every field, plus Edit and Delete buttons. The artist name links to the artist detail page.
- Edit uses the same form, pre-filled.
- Delete asks "Are you sure you want to delete <title>?" and only deletes if the user confirms.
- Keep the data isolation rule: users only ever see and change their own records.

Do not add validation messages, stars, search or the dashboard yet. Basic HTML required attributes are fine, but no custom validation logic.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/crud.md with this prompt word for word plus a summary of what you built and any problems you hit, and list the steps to test add, view, edit and delete.

## Summary

Implemented the record create, read, update, and delete flow. Users can add a record with all requested fields; typing an existing artist name reuses that user's artist, and a new name creates an artist owned by that user. My Collection now displays record cards, and each card opens a detail page with the record fields, artist link, Edit, and Delete actions. Deletion has a separate confirmation page before the record is removed.

Record and artist queries are scoped to the signed-in user's ID, including detail, edit, and delete requests. No validation messages, stars, search, or dashboard were added.

Problems hit: verification first found missing page-renderer imports and a PostgreSQL date-formatting mismatch; both were fixed, and the full CRUD smoke test passed.

## Steps to test

1. Log in and open **My Collection**. Select **Add record**.
2. Enter a title, artist name, and format; fill optional fields and save. Confirm the detail page shows every field and the artist name links to that artist's page.
3. Return to **My Collection** and confirm the new card shows its title, artist, year, and rating.
4. Add another record with the same artist name (including a different letter case) and confirm the existing artist is reused.
5. From the record detail page, select **Edit record**, change one or more fields, save, and confirm the updated values appear on the detail page and card.
6. Select **Delete**, then **Cancel** and confirm the record remains. Open **Delete** again, confirm deletion, and verify the record is gone from My Collection.
7. Sign in as another account and confirm the first user's records do not appear; opening a first-user record URL should return **not found**.
