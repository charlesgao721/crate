Read PLAN.md first. Build ONLY feature 4 (Validation).

On the add and edit record forms:
- Title, artist and format are required. If any is blank, do not save; re-show the form with what the user typed, and a friendly message next to the field, e.g. "Please add a title".
- Rating, if given, must be a whole number from 1 to 5.
- Release year, if given, must be between 1900 and the current year.
- Price paid cannot be negative.
- Check these rules on the server too, not only in the browser, so bad data is rejected even if someone bypasses the form. Put the rules in one reusable validation function.

Sign up should also show friendly messages for a missing email, an email that is already registered, and a password under 8 characters.

Do not build stars, search or the dashboard.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/validation.md with this prompt word for word plus a summary of where the checks live (browser and server) and any problems you hit, and tell me how to test each rule.

## Summary

The record rules live in the shared `validateRecord` function in `public/record-validation.js`, which runs in the browser and is also required by the server for create and edit. The server re-renders invalid record submissions with field messages and preserved values. Sign-up email and password checks run on the server and show messages beside their fields.

Problems hit: Native browser constraints would have intercepted submissions before inline field errors appeared. The record form now uses the same validator in the browser and server, so inline feedback and server-side rejection both work.

## Steps to test

1. Log in, open **My Collection**, and select **Add record**. Submit with the title blank, then the artist blank, then the format blank. Each should show a friendly message beside that field without clearing the other entries.
2. Enter a rating of `3.5`, then `0`, then `6`. Each should show a rating message. Leave rating blank once; it should be accepted.
3. Enter release year `1899`, then a year one greater than the current year. Each should show a year message; `1900` and the current year should be accepted.
4. Enter price paid `-1`; it should show a price message. Enter `0` and a positive price to confirm they are accepted.
5. To confirm server-side rejection, open the developer console on the add/edit page and run `document.querySelector(".record-form").addEventListener("submit", event => event.stopImmediatePropagation(), true)`, then submit an invalid value. The server should re-show the form with the same message and preserved values.
6. Save a valid record, open **Edit record**, and repeat the invalid-value tests. Confirm the stored record does not change.
7. Open **Sign up**. Submit with email blank, then with a password under 8 characters; each should show its friendly field message. Submit again with an email already used by an account and confirm the registered-email message appears.
