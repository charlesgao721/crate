Read PLAN.md first. Build ONLY feature 7 (Dashboard).

A Dashboard page, linked in the header, for the signed-in user showing:
- Total records
- Total spent (sum of price paid, formatted as dollars with 2 decimals; records with no price count as 0)
- Average rating (one decimal place, only counting records that have a rating; show "No ratings yet" if none)
- A bar chart of number of records by genre (records with no genre grouped as "Unspecified"), using the PLAN.md accent color. A lightweight chart library like Chart.js is fine.

Put the stat calculations in their own pure function in its own file (for example computeStats(records) in src/stats.js), separate from the page and database code, so it can be unit tested later. Only count the signed-in user's records.

Do not build any other feature.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/dashboard.md with this prompt word for word plus a summary and any problems you hit, and tell me the name and file of the stats function.

## Summary

Added an authenticated `/dashboard` page and a header link. The page shows total records, total spent (missing prices count as zero), average rating (or "No ratings yet"), and a burnt-orange horizontal bar chart of records by genre, grouping blank genres as "Unspecified". The dashboard query selects only records owned by the signed-in user.

The pure `computeStats(records)` function is in `src/stats.js`; it calculates totals, the average of rated records, and genre counts without database or page dependencies.

Problems hit: none.
