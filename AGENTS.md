# Repository workflow

For every sprint:

1. Inspect the current checkout and remote state; start a descriptive feature/fix branch.
2. Implement the smallest complete change and meaningful tests.
3. Run `npm run check`; validate the relevant browser/API/database flow.
4. Red-team the change for access-control bypass, private-data exposure, conflicts, destructive actions and false success reporting. Fix findings and retest.
5. Open a GitHub pull request with the final problem, behaviour, validation and any shared-infrastructure changes. Attach it to the chat.
6. Check CI and review the final diff, then merge after checks pass under the owner's standing sprint instruction. Respect branch protections and any subsequently narrowed permission.

Keep private data, account identities, credentials, project connection values and owner financial context out of the public repository. Continue requiring explicit approval for paid services, public app deployment, customer outreach or other consequential actions outside the authorised sprint scope.
