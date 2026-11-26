# Publication audit

Audit date: 26 November 2026

This is a sanitized record of the publication audit requested in the course submission guidelines. It contains no credentials, private configuration values, or secret scan output.

## What was checked

The first pass was performed without modifying files or running the extension. It reviewed:

- Git status, tracked files, recent history, and repository organization
- current files and every reachable commit for common high-risk credential patterns
- history for sensitive filenames such as environment files, private keys, certificates, and credential files
- ignore rules for local dependencies, build output, reports, logs, and environment files
- the manifest, permissions, background worker, new-tab scripts, bundled assets, and tests
- README coverage of purpose, collection, persistence, interaction, setup, learning, limitations, and assistance
- the demonstration screenshot for accidental personal or sensitive information

## First-pass findings

### Confirmed issues requiring action

1. `.gitignore` covered operating-system files and logs but did not exclude common local dependency, coverage, build, or environment files.
2. The first sentence of `PRIVACY.md` could be read as saying that the extension never transmits any user input, even though the document later explains that an intentional Google search sends the query to Google.

### Recommended improvements

- Continue testing the installed extension in Chrome because structural tests cannot fully reproduce Manifest V3 service-worker, alarm, storage, and notification behavior.

### Checks with no confirmed issue

- No credential, API-token, private-key, database-URL, or other high-risk secret pattern was found in the current tracked files or reachable file history.
- No sensitive configuration or key filename was found in reachable file history.
- The extension uses bundled scripts and images; it contains no remote JavaScript dependency or API key.
- The README contains the required course documentation and a screenshot.
- The screenshot contains demonstration content only and shows no personal tasks, notes, searches, accounts, or credentials.

## Fixes made

- Expanded `.gitignore` for `node_modules`, coverage, build output, and environment files while allowing a future safe `.env.example`.
- Clarified `PRIVACY.md`: dashboard data is not sent to a project server, but an intentional search sends the search terms to Google.

## Repeat audit and evidence

After the fixes:

- `git diff --check` reported no whitespace errors.
- The four dependency-free smoke tests passed.
- JavaScript syntax checks passed for `newtab.js`, `background.js`, and `images.js`.
- The high-risk credential and sensitive-filename scans were repeated with no confirmed finding.
- Common dependency, coverage, build, environment, log, and operating-system files are now ignored.
- The public repository returned HTTP 200 in an anonymous request.

## Remaining limitations

- Automated tests are structural and do not replace a manual installed-extension check in Chrome.
- Chrome notification behavior still depends on browser and operating-system notification settings.
- A secret scan reduces risk but cannot prove that a repository is safe.
