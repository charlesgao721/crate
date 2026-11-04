Read PLAN.md first. Build ONLY feature 8 (Random pick).

- A "What should I spin tonight?" link in the header that opens a /spin page.
- The page picks one random record from the signed-in user's collection and shows it in a card (title, artist, year, genre, rating) with a link to its detail page and a "Pick again" button.
- An optional genre dropdown (built from the user's own genres) limits the pick to that genre, and "Pick again" keeps the chosen genre.
- If the user has no records, or none in the chosen genre, show a friendly message instead of an error.
- Keep data isolation and use parameterized SQL.

Do not build any other feature.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/random-pick.md with this prompt word for word plus a summary and any problems you hit.

## Summary

Added the “What should I spin tonight?” header link and authenticated `/spin` page. The page picks a random record, displays its title, artist, year, genre, and rating, and links to its detail page. The genre dropdown is populated from the signed-in user's records; its selected value is preserved by “Pick again.” Empty collections and filters with no matching records show friendly messages. Both the genre list and random-record queries are scoped by the signed-in user's id, with the selected genre passed as a parameter.

Problems hit: none.
