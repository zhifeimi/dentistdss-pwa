# Security Fix Report — Superseded Session Refresh

## Scope

- Repository: `dentistdss-pwa`
- Branch: `refactor/chatbot-transport`
- Base: `36b14f74e6760e4d3a56f0e4223abf935ceb6f6a`
- Ruling: never replay an original request after `SessionRefreshSupersededError`; preserve the newer session and reject the stale request. Same-epoch refresh still replays once.

## Changes

- `src/services/config.ts`
  - Keeps the existing `_retry` guard and same-epoch refresh replay.
  - Marks a request with an internal `_refreshSuperseded` flag when refresh is superseded.
  - Never replays that request, regardless of whether a newer bearer exists.
  - Preserves the current session by skipping local cleanup, termination, broadcast, and redirect for the superseded path.
  - Continues ordinary 401 error presentation and rejects the original Axios error.
- `src/services/chatbot.ts`
  - Converts a superseded refresh into the existing sanitized non-terminal `unauthorized` `ChatTransportError`.
  - Does not read/rebuild a bearer header or issue a second exchange request on that path.
  - Returns cancellation only when the caller signal is actually aborted.
  - Leaves ordinary refresh failure termination and same-epoch replay unchanged.
- `tests/unit/tokenRefreshRetry.test.ts`
  - Replaced superseded replay expectations with a mutation-shaped password request regression test.
  - Asserts no replay, newer bearer preservation, stable rejection, snackbar presentation, and no terminal effects.
  - Removed obsolete superseded replay HTTP-500/network tests.
- `tests/integration/chatbot.test.ts`
  - Replaced superseded replay expectation with no-second-exchange and sanitized unauthorized assertions.
  - Updated logout/no-bearer supersession to remain non-terminal and non-duplicative.

## TDD evidence

### RED

Command:

```text
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts vitest --run tests/unit/tokenRefreshRetry.test.ts tests/integration/chatbot.test.ts
```

Result: expected failure — 3 tests failed because the pre-fix implementation replayed the Axios request or returned the terminal chatbot error instead of the required non-terminal unauthorized error.

### GREEN

The same focused command passed:

- 2 test files passed
- 33 tests passed

## Verification

- Focused lifecycle/Axios/chatbot/SSE suite: 4 files, 63 tests passed.
- Full Vitest: 24 files, 193 tests passed.
- `deno task check`: formatting, lint, and typecheck passed.
- `deno task build`: production build passed.
- `test ! -e node_modules`: passed; no repository-local `node_modules` directory exists.
- Focused Chromium chat specs (`chat-pages.spec.ts`, `floating-chat-helper.spec.ts`): 21 tests passed.
- `git diff --check`: passed.

The production build emitted the existing large-chunk warning; it did not fail the build and is unrelated to this transport fix.

## Re-review fix round

The re-review identified that same-epoch replay was still inside the refresh `try/catch`. A replay HTTP 500 or network failure could therefore be mistaken for refresh failure, causing the original 401 handler to run again.

- Added parameterized Axios regressions for same-epoch refresh success followed by replay HTTP 500 and network failure.
- Each regression asserts one refresh, one replay with `_retry`, direct replay-error propagation, refreshed bearer preservation, exactly ordinary replay snackbar presentation, and no outer termination or redirect.
- RED: the two new tests failed because the original 401 error replaced the replay error and duplicate error handling occurred.
- GREEN: focused lifecycle/Axios/chatbot/SSE suite passed with 4 files and 65 tests.
- Implementation now records explicit refresh outcomes (`succeeded`, `superseded`, or `failed`), catches only `session.refreshSession()`, and performs the replay outside that catch only for a successful same-epoch refresh. Superseded refreshes still never replay and skip terminal cleanup; ordinary refresh failures retain existing terminal behavior.
- Full Vitest after the fix passed with 24 files and 195 tests.
- `deno task check`, production build, `test ! -e node_modules`, and `git diff --check` all passed after the fix.
- The parallel Chromium run had 4 readiness failures and 17 passes; a serial rerun of the same focused specs passed all 21 tests. The failures were UI startup/readiness timeouts, not transport assertions.

## Working-tree note

The worktree contained pre-existing modifications in unrelated files and an untracked `.claude/` directory. They were preserved and are not part of this change. Dependencies and audit baselines were not modified.
