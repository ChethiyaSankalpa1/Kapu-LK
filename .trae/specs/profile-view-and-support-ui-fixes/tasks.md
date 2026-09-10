# Kapu-LK: Profile View Deduplication & Support Inbox UI - Implementation Plan

## Task 1: Notification Model Schema Expansion + Indexes
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add `viewCount` (Number, default 1) and `lastViewedAt` (Date, default Date.now) fields to `server/models/Notification.js`
  - Ensure existing documents default correctly (backfill via schema defaults + migration-safe update logic in the dedup merge task)
  - Add compound index: `{ user: 1, relatedUser: 1, type: 1, lastViewedAt: -1 }`
  - Keep existing index `{ user: 1, isRead: 1, createdAt: -1 }` intact
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-6, FR-4, FR-5, NFR-3
- **Test Requirements**:
  - `rule` TR-1.1: After model load, `Notification.schema.paths.viewCount` and `Notification.schema.paths.lastViewedAt` exist and have correct defaults
  - `rule` TR-1.2: `Notification.listIndexes()` (or `Notification.collection.getIndexes()` in script) contains the new compound index spec after Mongoose syncs
  - `rule` TR-1.3: Creating a notification without `viewCount`/`lastViewedAt` sets them to `1` and `Date.now` respectively
- **Notes**: The compound index supports both the upsert query filter (user+relatedUser+type+recent-lastViewedAt) and the dedup merge grouping.

## Task 2: Backend — Atomic Upsert for Profile Views in `getUserById`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Rewrite the `Notification.create(...)` block inside `userController.getUserById`
  - New flow: skip if `isSelfOrAdmin` (keep existing self/admin skip). Otherwise compute 24h-ago cutoff, run a single `Notification.findOneAndUpdate` with:
    - filter: `{ user: ownerId, relatedUser: viewerId, type: 'profile_view', lastViewedAt: { $gte: twentyFourHoursAgo } }`
    - update: `{ $set: { lastViewedAt: now, message: latestMessageText }, $inc: { viewCount: 1 }, $setOnInsert: { createdAt: now, user: ownerId, relatedUser: viewerId, type: 'profile_view', viewCount: 1, message: firstMessageText, isRead: false } }`
    - options: `{ upsert: true, new: true, setDefaultsOnInsert: true }`
  - Verify the `isSelfOrAdmin` logic still correctly excludes self and admin
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-7 (backend half), FR-1, FR-2, FR-3, NFR-2
- **Test Requirements**:
  - `rule` TR-2.1: Call endpoint twice as same viewer for same owner within seconds — notifications collection yields exactly 1 `profile_view` doc for the pair, `viewCount === 2`
  - `rule` TR-2.2: Call endpoint as admin for user O — 0 `profile_view` docs created with relatedUser === adminId, user === O
  - `rule` TR-2.3: Call endpoint as user A for user A id (self) — 0 `profile_view` docs for pair (A,A)
  - `rule` TR-2.4: Manually set existing doc `lastViewedAt` to 26h in the past, call endpoint again — new count of profile_view docs for pair === 2 (old kept, new created), new doc has `viewCount: 1`
- **Notes**: The atomic `findOneAndUpdate` with the `lastViewedAt >= 24hAgo` filter guarantees that when two concurrent requests fire and no 24h-active doc exists, both will "miss" on the find-filter and race for upsert — MongoDB's single-document atomicity guarantees only one insert wins and the other applies the update to the inserted doc, incrementing `viewCount` to 2. This is the desired behavior.

## Task 3: Backend — Pagination & Read-Only Guarantee for `getNotifications`
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Modify `notificationController.getNotifications` to support `page` (default 1) and `limit` (default 30, max 100) query params
  - Return response shape: `{ notifications, total, page, totalPages, hasMore }` (still backward compatible: consumers reading array from res.data used to receive a bare array; to be safe with old axios consumers that destructure `response.data` as an array, check if any call-site expects a bare array. Dashboard.js line 168 does `const items = response.data || []` which will break if we return an object. Therefore: keep the default response shape as a bare array when pagination params are NOT provided. If params ARE provided, return the paginated object envelope, OR always return `{ items, total, page, totalPages, hasMore }` and update the TWO known call sites (App.js GlobalRealtimeMonitor line 147 and Dashboard.js line 167). Inspect and choose the update-both-callers approach for cleanest long-term maintainability.
  - Add pagination metadata fields to response
  - Also add ownership validation: filter already reads `{ user: req.user._id }` which is correct; no write operations anywhere in the function path (confirm statically)
  - Update `notificationAPI.getNotifications` in `client/src/services/api.js` to accept optional `{ page, limit }` params, defaulting to `{}` to preserve old call signatures
  - Update both call sites: Dashboard.js fetchNotifications and App.js GlobalRealtimeMonitor checkNotifications — if they don't need pagination (they both want a reasonable latest), keep calling without params to hit default limit of 30, but correctly deserialize object response if we go with always-envelope approach
- **Acceptance Criteria Addressed**: AC-4, AC-5, FR-6, FR-8, NFR-1, NFR-6
- **Test Requirements**:
  - `rule` TR-3.1: `GET /notifications` with no params returns an array (or envelope with items array) of up to 30 docs for the calling user — ownership validated
  - `rule` TR-3.2: `GET /notifications?page=1&limit=5` as user with 50+ notifs — returns exactly 5 docs, response includes `total: >=50, page: 1, totalPages: >=10, hasMore: true`
  - `rule` TR-3.3: `GET /notifications?page=2&limit=5` — docs are createdAt-desc distinct from page 1; none are from other users
  - `rule` TR-3.4: Static code scan: `getNotifications` has zero `insert`, `update`, `save`, `create`, `findOneAndUpdate`, `findOneAndDelete` calls in its call graph — strictly read-only
- **Notes**: Decide on response strategy up front (either always-envelope and fix two call sites, or conditional shape). Recommendation: always-envelope for consistency.

## Task 4: Backend — Duplicate Profile-View Merge Cleanup
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1
- **Description**:
  - Add a utility function (callable on server start as a best-effort, plus expose as an admin-only endpoint `POST /api/notifications/admin/merge-profile-view-duplicates` behind protect + admin check, so it can be re-run on demand)
  - Algorithm:
    1. Aggregate `Notification.aggregate([{ $match: { type: 'profile_view', relatedUser: { $exists: true } } }, { $group: { _id: { user: '$user', relatedUser: '$relatedUser' }, docs: { $push: { _id: '$_id', viewCount: { $ifNull: ['$viewCount', 1] }, lastViewedAt: { $ifNull: ['$lastViewedAt', '$createdAt'] }, createdAt: '$createdAt', message: '$message', isRead: '$isRead' } }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }])`
    2. For each group:
       - Find the doc with MAX(lastViewedAt, createdAt tiebreak): that is the `keeper`
       - Sum all `viewCount` across all docs → `totalViewCount`
       - Update the keeper: set `viewCount = totalViewCount`, ensure `lastViewedAt = max(lastViewedAt)` , backfill if missing
       - Delete all other docs in the group (not keeper)
  - Run this cleanup automatically on server bootup (wrap in try/catch, do not block server listen — fire-and-forget Promise with timeout)
  - Also expose an admin-only route in `notificationRoutes.js` (protect + admin role check)
- **Acceptance Criteria Addressed**: AC-6, FR-7
- **Test Requirements**:
  - `rule` TR-4.1: After script run on a test fixture of 3 dupes (same user+relatedUser), query returns exactly 1 doc with viewCount equal to the sum; deleted docs are gone; kept doc retains the MOST RECENT lastViewedAt timestamp
  - `rule` TR-4.2: Non-duplicated notifications untouched by the merge script
  - `rule` TR-4.3: Admin route returns `{ success: true, mergedGroups: N, deletedDocs: M }` summary for observability
- **Notes**: Use mongoose `session.withTransaction` for each group if possible for safety, but individual group operations are independent so a per-group transaction is fine and rollback on error per group.

## Task 5: Frontend — UserDetail useEffect Dedup & One-Shot API Call Guard
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2 (for backend dedup, but client dedup is independently valuable)
- **Description**:
  - In `client/src/pages/user/UserDetail.js`:
    - Add a `useRef` pair: `lastFetchedIdRef = useRef(null)` and `fetchInFlightRef = useRef(false)`
    - Modify the `fetchUser` function (or its useEffect invoker) so that:
      - If `id === lastFetchedIdRef.current` AND user state already exists for that id → skip call (memo-like guard)
      - If `fetchInFlightRef.current` → skip (prevent double-fire from StrictMode second effect)
      - Otherwise: set inFlight=true, store id, run the fetch, clear inFlight on finally, keep lastFetchedId on success
    - Ensure the effect still re-fetches correctly if id actually changes (navigating from user A → B from within the component)
  - Optional: the `fetchAdmin` call inside the same effect has its own guard (`if (isAdmin) return`) so that is safe; keep it.
- **Acceptance Criteria Addressed**: AC-7, FR-8
- **Test Requirements**:
  - `rule` TR-5.1: With React.StrictMode ON, mount UserDetail for id=X in a test harness — Network panel or API request counter shows exactly 1 `GET /users/X` request; no double request
  - `rule` TR-5.2: Within same mounted instance, programmatically force a re-render (via parent state change) that does NOT change `id` → 0 additional `GET /users/X` requests
  - `rule` TR-5.3: Change params `id` from X→Y during navigation → exactly 1 `GET /users/Y` new request fires (correct refetch on new id)
- **Notes**: This is defense-in-depth even after backend dedup. The backend is the single source of truth for no-duplicates, but the client guard eliminates unnecessary network traffic, especially noisy under StrictMode.

## Task 6: Frontend — Support Inbox Text Contrast & Theme Fixes
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Audit `client/src/components/admin/SupportInboxTab.jsx` for all text elements:
    - **Stat cards** (lines ~191-249): titles use `text-gray-500 dark:text-gray-400` on `bg-white dark:bg-gray-800` — change to `text-gray-700 dark:text-gray-300` (WCAG AA passing for 14px-small). Value numbers already contrast well, double-check `text-amber-600` on `bg-amber-500/10` — the translucent bg is fine because true bg is still the card bg (white / gray-800).
    - **Inbox header** line 293: `"Inbox (N)"` label uses `text-gray-700 dark:text-gray-300` → already good. Secondary line 296 `text-gray-400` → bump to `text-gray-600 dark:text-gray-400`.
    - **Search input** (line ~256-261): currently has `dark:text-white` but no light-mode text color. Add explicit `text-gray-900 dark:text-white`. Placeholder: `text-gray-400` via global styles is fine but confirm.
    - **Category filter select** (line ~266-276): same — add `text-gray-900 dark:text-white`.
    - **Status filter select** later, status/priority selects in details pane — same treatment.
    - **Ticket rows (311-361)**:
      - Date line 338-343: `text-gray-400` → bump to `text-gray-600 dark:text-gray-400`
      - Ticket `#number` line 327-328: `text-gray-900 dark:text-white` → good
      - Subject line 346-347: `text-gray-800 dark:text-gray-200` → good
      - Sender+Category line 350-357: `text-gray-500 dark:text-gray-400` → bump to `text-gray-700 dark:text-gray-300`
    - **Right-column inspector header (366-412)**:
      - Ticket # & status text: `text-gray-900/white` → good.
      - Requester/Category metadata line 401: `text-gray-500 dark:text-gray-400` → bump to `text-gray-700 dark:text-gray-300`; the strong spans are `text-gray-700/300` already → good.
      - Created-at date 392-395: `text-gray-500` → bump to `text-gray-600 dark:text-gray-400`.
    - **Messages thread container (414-454)**:
      - Each bubble meta text `opacity-75` (line 427) combined with `text-[11px]` is too low contrast. Remove the `opacity-75`; instead give explicit `text-purple-700 dark:text-purple-200` for admin bubbles and `text-gray-700 dark:text-gray-300` for user bubbles (and keep the timestamp as `text-gray-500 dark:text-gray-400` on its own span).
      - `msg.text` paragraph 450: ensure `whitespace-pre-wrap break-words overflow-wrap-anywhere` (add all three utilities or equivalents).
    - **Reply form (457-504)**:
      - Reply header labels 461-478: `text-gray-700 dark:text-gray-300` → good.
      - Status select 468-477: add explicit `text-gray-900 dark:text-white`.
      - Textarea 481-488: `text-gray-800 dark:text-gray-200` → good; placeholder handled by global.
    - **Admin notes / status section (506-562)**:
      - Section labels 510, 525, 542-543: `text-gray-600 dark:text-gray-400` → bump to `text-gray-700 dark:text-gray-300` (11px is small; need >=4.5:1).
      - Selects 513-523, 528-537: `text-gray-900 dark:text-white` explicitly.
      - Textarea 545-551: `text-gray-800 dark:text-gray-200` → keep; already good.
      - Button 554-561: `text-gray-800 dark:text-gray-200` → on `bg-gray-200/700` → sufficient contrast, but add `focus-visible:outline` and keep as is.
    - **Empty state (564-574)**: paragraph text `text-gray-600/400` → bump to `text-gray-700 dark:text-gray-300` for the headline.
  - Add `class="!text-gray-900 dark:!text-white"` overrides via select/input component-level if any are still invisible; worst case inline style with theme check, but Tailwind dual classes should suffice.
  - Ensure all `select option` dropdowns keep the global CSS overrides in `index.css` lines 230-237 (they already set explicit bg+fg for options → good).
- **Acceptance Criteria Addressed**: AC-8, AC-11, FR-9, FR-10
- **Test Requirements**:
  - `rule` TR-6.1: Chrome DevTools Inspect → Accessibility on 10+ representative elements (stat card label, ticket date, requester email, created-at, ticket subject, admin message meta, reply textarea text, notes label, priority select text) — ALL show "AA" pass contrast in both themes.
  - `rubric` TR-6.2: Inbox holistic contrast readability. Scale 1-5; 1=unreadable, 3=mostly OK one bad spot, 5=all elements easily readable both themes; threshold >= 4; evidence: screenshots + contrast annotations.

## Task 7: Frontend — Support Inbox Chronological Messages, Wrap, Scroll, No Clipping
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `SupportInboxTab.jsx` messages thread rendering (line 416 `selectedTicket.messages?.map`):
    - Sort messages before map: create a stable sorted copy, `const sortedMessages = useMemo(() => [...(selectedTicket.messages || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [selectedTicket.messages])`
    - Map over `sortedMessages` instead.
  - Add overflow protection + wrapping:
    - Message `<p>` 450: upgrade from `whitespace-pre-line` to `whitespace-pre-wrap break-words overflow-wrap-anywhere text-pretty`.
    - All bubble containers (420-426): ensure they have `min-w-0` and their parent `div` has `min-w-0` so grid flex children shrink correctly (critical to prevent children from expanding grid width and causing horizontal scroll).
    - Subject `h2` (397-398), requester/category metadata (401-411): add `break-words` / `truncate` or `min-w-0` containers so long subjects don't blow out grid.
  - Scrollable region + clipping fix:
    - Two-column grid wrapper (288-289): remove any fixed min-height that's too small OR ensure both children have `min-h-0` inside grid `min-h-[550px]` — grid children need `min-height: 0` to honor overflow-y inside them (currently the left col has `flex flex-col`, right col has `flex flex-col min-h-0`? check; add `min-h-0` to BOTH columns so internal `overflow-y-auto` works).
    - Messages thread div (415): currently `max-h-[380px] flex-1 overflow-y-auto`. Change to use `flex-1 min-h-[120px] overflow-y-auto chat-scrollbar` and remove hardcoded max-height (let the grid allocate via flex); if total flex layout doesn't work, keep a reasonable max-height but ensure `overflow-y-auto` is applied and working. The container needs a bounded height from parent (flex column → right column is flex, the messages region is flex-1). Ensure right column `<div className="lg:col-span-7 ... overflow-hidden flex flex-col">` — add `overflow-hidden` and ensure its internal child `<div className="flex-1 flex flex-col min-h-0">` — this pattern is required for nested flex scrollability.
  - Ticket list (299): currently `overflow-y-auto max-h-[640px]` — add `min-h-0` class to parent of this div so grid respects overflow; also set `overscroll-contain` to prevent scroll chaining to body.
- **Acceptance Criteria Addressed**: AC-9, AC-10, FR-11, FR-12, FR-13
- **Test Requirements**:
  - `rule` TR-7.1: Messages with 30 shuffled-createdAt records render in strictly ascending order (oldest at top, newest at bottom); first DOM bubble createdAt is the minimum; last DOM bubble createdAt is the maximum
  - `rule` TR-7.2: Message with a single 300-char-no-space word AND 10 line breaks — zero horizontal scroll on `window`, `document.documentElement.scrollWidth <= clientWidth`; text is fully visible (clippedHeight === scrollHeight within container, i.e., scroll works)
  - `rule` TR-7.3: Long ticket subject of 120 characters and requester email 60 chars — both columns render without blowing out grid width; horizontal scrollbar does NOT appear on page

## Task 8: Frontend — Support Inbox Responsive Layout (Desktop Split / Mobile Stack)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 7 (so stacking + scroll constraints are consistent)
- **Description**:
  - Existing grid: `grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]` (line 289). Left column `lg:col-span-5`, right `lg:col-span-7`. Already stacked below lg — but current right column without a selected ticket shows the "select a ticket" empty state correctly on desktop, but on mobile users have to scroll past inbox to see the ticket they tapped. Improve UX:
    - Mobile (< lg): when `selectedTicket` is not null, hide inbox column with `hidden lg:block` and show ticket details full width (remove `lg:col-span-7`, instead `col-span-12` with no `hidden`); provide a clearly visible "← Back to Inbox" button at the top of the ticket inspector on mobile (<lg only, use `lg:hidden`) that calls `setSelectedTicket(null)` to return to inbox view.
    - Desktop (>= lg): show both columns side-by-side always; no back button needed.
  - To achieve this:
    - Left column class updates: `col-span-12 lg:col-span-5 ${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col`
    - Right column class updates: `col-span-12 lg:col-span-7 ${!selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col overflow-hidden`
    - In the right column header (around line 370, before ticket number line), add a `lg:hidden mb-3` button: `<button onClick={()=>setSelectedTicket(null)} className="flex items-center gap-1 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-800">← Back to Inbox</button>` (with lucide ArrowLeft if desired).
  - Apply `min-w-0` to both columns to ensure no grid overflow on narrow widths.
  - Ensure stat cards (top 190-249): `grid-cols-2 sm:grid-cols-4` — already responsive; keep; double-check at 320px the cards stack to 2 columns without text clipping (if any label text wraps it's fine).
- **Acceptance Criteria Addressed**: AC-10, FR-12, FR-13, NFR-4
- **Test Requirements**:
  - `rule` TR-8.1: At 1440px (lg up, say 1280) — BOTH columns visible horizontally; left is ~42% width right ~58%; inbox scrolls, ticket scrolls
  - `rule` TR-8.2: At 375px (mobile), NO ticket selected → inbox full width visible, inspector hidden; TAP a ticket → inbox hidden, inspector full-width with visible Back button; TAP Back → inbox returns, inspector hidden
  - `rule` TR-8.3: At ALL widths 360→2560 (10 widths sampled), `window.document.documentElement.scrollWidth === window.document.documentElement.clientWidth` (zero horizontal page scroll)

## Task 9: API Contract Updates for Response Shape Compatibility Verification
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3 (pagination response change)
- **Description**:
  - If Task 3 chooses "always-envelope" approach:
    - Update `client/src/services/api.js` `notificationAPI.getNotifications` default behavior to extract `response.data.items || response.data` (if array) to keep call sites simple; OR
    - Update both call sites (Dashboard 164-176, App.js 145-201) to destructure the envelope correctly.
  - In server response: for backward compatibility with external consumers, keep returning a BARE array when pagination query params are absent (so code that relied on `response.data.map()` from before still works). Add a custom header `X-Total-Count` for consumers that want metadata even on the default call.
  - Actually recommended: **hybrid default + params** → simplest. Keep default `/notifications` (no params) behavior as `res.json(arrayOfDocs)`. Add pagination ONLY when `page` or `limit` query param present: return `{ items, total, page, totalPages, hasMore }`. This keeps existing two call sites 100% compatible without touching them.
- **Acceptance Criteria Addressed**: AC-11, NFR-1
- **Test Requirements**:
  - `rule` TR-9.1: `GET /notifications` (no params) → response body `Array.isArray(res.body)` is true; length <= 30; old Dashboard.js code `const items = response.data || []` works unchanged
  - `rule` TR-9.2: `GET /notifications?page=1&limit=10` → response body has shape `{ items: Array, total, page, totalPages, hasMore }`; `items.length === 10`
  - `rule` TR-9.3: Neither support endpoints nor user endpoints break; smoke test all call sites with manual or automated request.

## Task 10: Smoke Test, Lint, Build, and Report Evidence Collection
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1-9 complete
- **Description**:
  - Client: run `npm run build` from root (which runs `--workspace=client` build). This runs eslint + production build.
  - Client: if build fails on lint warnings, fix them (unused vars, missing keys, etc.) in the modified files.
  - Server: run `node -c server.js` and run a quick import sanity check by requiring all modified model/controller modules in a small test script (no syntax errors, no missing requires).
  - If any tests exist in `server/tests/` (`consentAndMaintenance.test.js`, `security.test.js`) — run them with `node --test` or Jest depending on config; check how they are run by inspecting package.json; if no test script, at least import and call the functions manually.
  - Collect command outputs (exit codes, counts, error counts) for final reporting.
  - Also run manual browser verification for:
    - Profile view dedup flow as described in AC-1-AC-3, AC-7
    - Support inbox contrast at both themes + mobile responsive flow AC-8-AC-10
- **Acceptance Criteria Addressed**: AC-12, AC-11
- **Test Requirements**:
  - `rule` TR-10.1: `npm run build` (client) exits code 0; no `Failed to compile`
  - `rule` TR-10.2: `node --check server.js` (or syntax check) and syntax check of each modified server module exit code 0
  - `rule` TR-10.3: Existing server tests (if any runnable) all pass; if not runnable, document "no test runner configured" as evidence but still demonstrate functional verification via smoke steps
