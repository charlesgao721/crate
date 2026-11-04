Read PLAN.md first. Build ONLY feature 6 (Find things).

On My Collection:
- A search box that matches title or artist name (case-insensitive, partial matches).
- Filter dropdowns for genre and format (built from the user's own values).
- A sort dropdown: Newest added (default), Highest rated, Release year, Price paid.
- Search, filters and sort work together, are kept in the URL query string so the page can be bookmarked, and there is a "Clear" button.
- If nothing matches, show "No records match your search."
- Keep data isolation: search only ever looks at the signed-in user's records. Use parameterized SQL, never string-concatenated user input.

Do not build the dashboard or any other feature.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/find.md with this prompt word for word plus a summary of how the search query works and any problems you hit.

## Summary

The My Collection GET route reads `q`, `genre`, `format`, and `sort` from the URL. Search uses bound parameters for case-insensitive substring checks against title and artist; genre and format options come only from the logged-in user's records and their selected values are also bound parameters. Sort keys map to fixed SQL order clauses. Every record and option query is restricted by the logged-in user's id. The GET form preserves the search/filter/sort state in the URL, and Clear returns to `/collection`.

Problems hit: none.
