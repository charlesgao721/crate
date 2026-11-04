---
name: Crate feature scope
description: The user's standing scope and Git workflow for the Crate project.
---

For Crate, implement only the feature explicitly requested in each prompt. The user handles Git branches, pull requests, merges, and pushes.

**Why:** The user asked to build the app one feature at a time, with each feature on its own branch and pull request, and explicitly said not to create, switch, merge, or push branches.

**How to apply:** Treat `PLAN.md` as the blueprint, but do not include adjacent features unless the user requests them in the current prompt. Leave all Git branch and GitHub actions to the user.
