Read PLAN.md section 4. Add the two automated tests, using Node's built-in test runner or Vitest/Jest plus Supertest, wired to "npm test". Be quick; I am short on time.

Test 1, data isolation: Given User A has added the record "Kind of Blue" by Miles Davis, when User B logs in and requests the record list and that record's detail page, then User B's list does not include it and the detail request returns not found. The test creates its own two users and data against the development database and cleans up afterwards, so it never touches real data.

Test 2, dashboard: Given records rated 5, 4 and 3 that cost $30, $25 and $20, when computeStats (src/stats.js) runs, then total records is 3, total spent is 75 and average rating is 4.0.

Then prove red-then-green for each test:
1. Temporarily remove the user_id filter from the query that lists records. Run npm test and show me the failing output. Restore it exactly.
2. Temporarily change the average in computeStats to divide by (count + 1). Run npm test and show me the failing output. Restore it exactly.
3. Run npm test one final time and show me both tests passing. Confirm with git diff that the app code is back to how it was.

Save the three raw outputs to test-evidence/1-isolation-red.txt, test-evidence/2-dashboard-red.txt and test-evidence/3-all-green.txt.

Do not create, switch or merge Git branches yourself, and do not push to GitHub. I handle Git.

When you are done, create prompts/tests.md with this prompt word for word, a plain-English explanation of what each test does step by step, and one sentence per test on a real change that would break it.

## What each test does

1. **Data isolation:** The test starts a temporary server on a free port and creates two uniquely named accounts. User A adds "Kind of Blue" by Miles Davis through the app. User B signs up, logs out, logs back in, then requests the collection and User A's record detail URL. The test checks that the collection does not contain the title and that the detail URL returns 404. It deletes its test sessions and users in a `finally` cleanup.
2. **Dashboard:** The test passes three sample records rated 5, 4, and 3 with prices $30, $25, and $20 to `computeStats`, then checks the record count, total spent, and average rating.

## Real changes that would break the tests

- **Data isolation:** Removing the signed-in user's `user_id` condition from the collection query would make User B's collection include User A's record and fail the test.
- **Dashboard:** Dividing the rating total by one more than the number of ratings would produce an average other than 4.0 and fail the test.
