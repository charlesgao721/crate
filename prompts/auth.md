Answer to your question: build Crate from the plan, but ONE feature at a time. Each feature goes on its own Git branch and through its own pull request, so never build more than I ask for in a single prompt.

Read PLAN.md in the project root first. It is the blueprint for this app.

Build ONLY feature 1 (Sign up and login) and the basic app skeleton it needs.

- Full-stack web app with a PostgreSQL database (use Replit's built-in database).
- A users table exactly as described in PLAN.md section 3.
- Sign up page: email, display name, password (minimum 8 characters). Passwords must be hashed with bcrypt. Never store plain text.
- Log in and log out with a session cookie. Do NOT use "Log in with Replit". Any visitor must be able to create an account inside the app.
- After login, show an empty "My Collection" page with a header showing the display name and a Log out button. Logged-out visitors who open any app page get sent to the login page.
- Use the design in PLAN.md section 6 (cream background #F5EFE6, near-black text #1E1E1E, burnt-orange accent #D9622B).

Do not build records, artists, stars or any other feature yet.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done:
1. Create prompts/auth.md containing this prompt word for word, then a short summary of what you built, which files hold the auth logic, and any problems you hit.
2. Tell me exactly how to test sign up, login and logout by hand.

## Summary

Built only feature 1: email/password sign-up and login, logout, a PostgreSQL-backed session cookie, and the protected empty My Collection page. The page uses the cream, near-black, and burnt-orange design palette from `PLAN.md`.

Authentication and request handling live in `src/server.js`; the page markup and escaping live in `src/views.js`; styling is in `public/styles.css`. The PostgreSQL schema is in `db/schema.sql`, with run instructions in `replit.md`.

Problems hit: the package installer warned that bcrypt's native install script was not pre-approved; bcrypt loaded and hashing/login worked in the smoke test. No records, artists, stars, or other planned features were added.
