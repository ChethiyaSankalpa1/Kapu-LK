# Kapu-LK: Profile View Deduplication & Support Inbox UI Fixes

## Overview
- **Summary**: Fix two defects: (1) repeated profile-view notifications via atomic deduplication, proper client-side guards, 24-hour windows, view-count tracking, pagination, and duplicate cleanup; (2) Admin Support Inbox UI text contrast, responsive layout, chronological message ordering, line-break preservation, and scrollable long conversations.
- **Purpose**: Eliminate user-reported notification spam, ensure correct in-app metrics, and make the admin support inbox usable and accessible across all screen sizes without breaking any existing APIs or functionality.
- **Target Users**: Regular members (profile view recipients, ticket submitters) and administrators (ticket reviewers, repliers).

## Goals
1. A single profile view by a viewer of another user's profile creates at most one `profile_view` notification within any rolling 24-hour window, updating `lastViewedAt` and `viewCount` for repeat views.
2. No profile-view notification is ever created when the viewer and the profile owner are the same user.
3. Existing duplicate `profile_view` notifications (same viewer + owner pair) are safely merged: newest timestamp kept, counts combined.
4. Notification polling (`GET /notifications`) only fetches data — it never records a profile view.
5. Admin Support Inbox displays every ticket label, message, date, input, dropdown, and button with WCAG AA-compatible text contrast in both light and dark themes, while preserving the existing purple/dark aesthetic.
6. Ticket messages (user + admin) always render in chronological order, preserve line breaks, wrap long content, and allow long conversations to scroll without clipping or horizontal overflow.
7. Admin Support Inbox shows inbox + ticket details side-by-side on desktop (>= lg) and stacks / full-width on mobile/tablet.
8. All existing public APIs, ticket workflows, message sending, and notification endpoints remain compatible — no route signature or response contract changes that would break existing client calls.

## Non-Goals
- Rewriting the authentication or notification type system.
- Adding socket.io / realtime push; polling-based notification fetch remains the only realtime transport.
- Changing premium gating, permissions, or support ticket category enum.
- Redesigning the global purple/dark palette; only contrast/visibility fixes within the theme.
- Creating any new admin dashboard tabs or pages.

## Background & Context
Root causes identified during codebase inspection:
1. **Profile-view duplicates**: `userController.getUserById` calls `Notification.create(...)` unconditionally on every fetch, with no dedup, no 24h window, no `viewCount`, no compound index. `UserDetail.js` triggers this fetch in a `useEffect` dependent on `useCallback` refs that can fire due to StrictMode double-invocation, route params changes, or any re-render.
2. **Support Inbox contrast**: In `SupportInboxTab.jsx`, multiple elements use `text-gray-400` / `text-gray-500` on light `bg-white` / `bg-gray-50`, and several select/textarea elements only specify dark text colors without a dark-mode class, leading to near-invisible text in light mode. Ticket list max heights, message thread overflow, and mobile grid spans are also set too aggressively, causing clipping without horizontal scroll protection.
3. **Message ordering**: Support ticket `messages` array uses `push()` which preserves insertion order, but the UI iterates the array without a sort guard; stale or unordered documents would render non-chronologically.

## Functional Requirements

### Profile View Deduplication
- **FR-1**: `GET /api/users/:id` SHALL emit a profile-view notification (or upsert an existing one) only if `req.user._id !== params.id` AND `req.user.role !== 'admin'`.
- **FR-2**: For a given `(viewer=req.user._id, owner=targetUserId, type='profile_view')`, at most ONE notification document SHALL exist at any time when the most recent `lastViewedAt` is within 24 hours. This SHALL be enforced via an atomic MongoDB `findOneAndUpdate` (upsert) with a compound index and a filter guarded by `lastViewedAt > now - 24h` OR a fresh insert when outside the window.
- **FR-3**: Repeat views within the 24h window SHALL increment `viewCount` by 1 and set `lastViewedAt` to the current time. A first-ever view (or first after >24h) SHALL set `viewCount` to 1 and `lastViewedAt`/`createdAt` to now.
- **FR-4**: Notification model SHALL have fields `viewCount` (Number, default 1) and `lastViewedAt` (Date, default Date.now), backfilled for existing docs.
- **FR-5**: A compound index SHALL exist on `Notification`: `{ user: 1, relatedUser: 1, type: 1, lastViewedAt: -1 }`.
- **FR-6**: `GET /api/notifications` SHALL support `page` and `limit` query params, return pagination metadata, and SHALL NOT mutate any document (read-only). It SHALL also validate ownership (`user === req.user._id` is already the filter).
- **FR-7**: A duplicate-merge cleanup logic SHALL be runnable: for every `(user, relatedUser, type='profile_view')` group with >1 doc, keep the one with the newest `lastViewedAt`/`createdAt`, set its `viewCount` to the SUM across duplicates, and remove the rest.
- **FR-8**: Client `UserDetail.jsx` SHALL call the user detail API at most once per correct profile load, guarded from double-fires (StrictMode, race conditions) via a ref or idempotency key, and SHALL only call the API when the profile `id` is stable AND the fetched user `_id` does not match the current user.

### Admin Support Inbox UI
- **FR-9**: Every textual element in `SupportInboxTab.jsx` SHALL meet at least a 4.5:1 contrast ratio (WCAG AA) against its nearest painted background in both light and dark modes.
- **FR-10**: Ticket list rows, header ticket subject, requester metadata, dates, status labels, category badges, stat card numbers and labels, search placeholder, filter dropdown options, reply textarea, admin notes textarea, status/priority selects, and all buttons SHALL have explicit dark/light text classes.
- **FR-11**: Messages thread SHALL sort by `msg.createdAt` ascending before render, SHALL wrap long lines with whitespace-pre-wrap + break-words, SHALL preserve line breaks, SHALL have a bounded vertical region with overflow-y auto, and SHALL NOT cause horizontal page scroll.
- **FR-12**: Layout SHALL be `grid-cols-1` (stacked) below `lg:` breakpoint and `lg:grid-cols-12` with col-span-5 inbox + col-span-7 details at `lg:` and above. When stacked, the selected ticket SHALL render full width above or below the inbox (mobile UX: details full width when selected; inbox hidden on mobile or toggleable — keep it simple: stack inbox then details in flow, both full width).
- **FR-13**: No horizontal scrolling of the page due to long ticket subjects, long messages, or long attachment names; every text container SHALL have `overflow-wrap: anywhere` or Tailwind equivalents.
- **FR-14**: All existing support API endpoints, ticket status transitions, and reply/notify user flows SHALL continue to operate unchanged.

## Non-Functional Requirements
- **NFR-1 (Backwards Compatibility)**: No breaking changes to existing request/response shapes of `GET /api/users/:id`, `GET /api/notifications`, nor any support ticket endpoints. New fields (`viewCount`, `lastViewedAt`) are additive. Pagination is optional in requests (defaults keep old behavior).
- **NFR-2 (Race Safety)**: Profile view recording MUST use a single atomic `findOneAndUpdate` with upsert such that two simultaneous requests cannot produce two active-within-24h notifications for the same (viewer, owner) pair.
- **NFR-3 (Performance)**: All added indexes MUST fit existing query patterns; new queries on Notification MUST use the compound index (`explain`-verified by reading the query shape).
- **NFR-4 (Accessibility / UX)**: Support Inbox usable at viewport widths from 360px (mobile) through 2560px (4K desktop) with no horizontal scrollbars anywhere on the page.
- **NFR-5 (Testability)**: Lint (`eslintConfig: react-app`) and `react-scripts build` MUST pass in client; server MUST start without exceptions on fresh `npm install`.
- **NFR-6 (Security)**: No new unauthenticated endpoints; new pagination params for `GET /notifications` remain behind `protect`.

## Constraints
- **Technical**: MongoDB (Mongoose 7.x), Node >=18, React 18 with StrictMode enabled, Tailwind 3 with class dark mode, axios client with interceptors. No new npm packages allowed unless absolutely required (this spec avoids them).
- **Business**: Do not remove or weaken existing premium gating, permissions (`protect`, `approved`, admin role checks), or rate limiters.
- **Dependencies**: Existing `Notification`, `SupportTicket`, `User` models; existing `notificationAPI.getNotifications`, `supportAPI.*`, `userAPI.getUserById` contracts.

## Assumptions
- Existing MongoDB deployments allow running an index build on the `notifications` collection without downtime (background/foreground is fine given small notification datasets).
- React StrictMode will remain enabled in development; any mitigation MUST work with StrictMode double-effects ON.
- The dashboard / Navbar polling at 15s intervals for `GET /notifications` is acceptable and MUST remain read-only.
- Admin users viewing a profile do not need to trigger a profile-view notification (existing code already skips them via `isSelfOrAdmin`); we keep that behavior.

## Acceptance Criteria

### AC-1: No self-views recorded
- **Type**: `rule`
- **Given**: Logged-in user A navigates to their own profile page (or calls `GET /api/users/{A's id}` directly)
- **When**: The request completes (any number of times, from multiple tabs, with StrictMode enabled)
- **Then**: Zero `type: 'profile_view'` notifications exist where `user === A._id` AND `relatedUser === A._id`
- **Pass Condition**: Query notifications collection; count === 0 for self-pair, and the API response does not contain a self-inserted notification
- **Evidence**: Server unit/integration assertion + manual call curl/postman of `/api/users/me-id` with check of notifications

### AC-2: Atomic 24h dedup — one notification per viewer/owner per 24h
- **Type**: `rule`
- **Given**: Two distinct users V (viewer) and O (owner), O's id is `oid`
- **When**: V makes 5 concurrent POST-like equivalent calls to `GET /api/users/:oid` (simultaneous requests, using Promise.all with axios.all)
- **Then**: The notifications collection contains exactly 1 active `profile_view` with `user===O` and `relatedUser===V` and `lastViewedAt` within 24h; `viewCount === 5`; `createdAt` equals timestamp of the first request
- **Pass Condition**: Aggregate/group query by (user,relatedUser,type) returns exactly 1 doc for this pair; viewCount === 5; lastViewedAt is freshest timestamp
- **Evidence**: MongoDB aggregation result for test pair; logs show single upsert path

### AC-3: After 24h a new notification is created
- **Type**: `rule`
- **Given**: Existing active profile-view notification for V->O with `lastViewedAt = T0` and `viewCount = 5`
- **When**: At time `T0 + 25 hours`, V views O's profile again (call `GET /api/users/:oid`)
- **Then**: The old notification (created at T0) remains in collection as history; a NEW notification is created with `viewCount = 1`, `createdAt = T0+25h`, `lastViewedAt = T0+25h`
- **Pass Condition**: Count of all V->O profile_view notifications === 2; latest one has viewCount 1 and createdAt at T0+25h; previous one untouched
- **Evidence**: Mock/move clock (or manually set lastViewedAt field to 25h ago with a direct update during test) then fetch and count docs

### AC-4: Notification polling never records views
- **Type**: `rule`
- **Given**: System at steady state with N notifications
- **When**: `GET /api/notifications` is called 100 times, mixed with Dashboard polling interval and App.js GlobalRealtimeMonitor polling
- **Then**: No new documents of any type are inserted into the notifications collection; `viewCount` and `lastViewedAt` on all docs unchanged
- **Pass Condition**: `countDocuments()` before and after are equal; no doc has viewCount increased; and review of `notificationController.getNotifications` code path has zero write operations
- **Evidence**: Static code inspection + before/after DB counts after a scripted 100-call loop

### AC-5: Notifications API pagination & ownership
- **Type**: `rule`
- **Given**: User A has 50 notifications in DB
- **When**: Call `GET /api/notifications?page=2&limit=10` as user A, and call same endpoint as user B (different user) with same params
- **Then**: (a) For A: returns exactly 10 notifications, skips 40 (items 41-50 sorted by createdAt desc), includes pagination metadata `{ total, page, totalPages, hasMore }`; (b) For B: returns zero docs (or B's own docs only — never A's)
- **Pass Condition**: Response shape includes pagination fields; length === 10; all returned `user` field === caller's id (ownership validation)
- **Evidence**: HTTP response body inspection of both calls

### AC-6: Existing duplicates merged safely
- **Type**: `rule`
- **Given**: 3 existing `profile_view` notifications for the same V->O pair with `viewCount: 1, 2, 3` and `createdAt: T1 < T2 < T3` (T3 is newest)
- **When**: The duplicate-merge migration/cleanup script is executed
- **Then**: Exactly one document remains for V->O profile_view: the one originally with createdAt T3; its `viewCount === 6`; its `lastViewedAt === T3`; the other two documents no longer exist
- **Pass Condition**: Aggregate count === 1; viewCount sum equals 6; kept doc id matches T3-doc's id
- **Evidence**: Before/after aggregation and per-doc viewCount dump

### AC-7: View API called once per stable profile load (StrictMode safe)
- **Type**: `rule`
- **Given**: React 18 app with StrictMode enabled, user V navigating to `/users/{oid}` (O !== V)
- **When**: Page fully mounts, re-renders, user navigates away and back; repeat across two browser tabs
- **Then**: For each unique page load (single route, stable `oid`), axios Network tab shows exactly 1 successful `GET /users/{oid}` request (not 2 from StrictMode effect double-firing); and that one request's result triggers exactly 0 or 1 profile-view side effects depending on O/V
- **Pass Condition**: Chrome DevTools Network panel filtered to XHR/fetch shows 1 `users/:id` per mount (StrictMode second effect call short-circuited); no duplicate network calls for same id in a single mount cycle
- **Evidence**: Network capture screenshot + code inspection of `useEffect` deps + dedup ref in UserDetail.js

### AC-8: Support Inbox text contrast (light + dark)
- **Type**: `rubric`
- **Dimension**: Readability of all Support Inbox text elements across both themes
- **Scale**: 1-5
- **Anchors**: 1 = Multiple labels/messages invisible in either theme; 3 = Majority readable, at least one still < 3:1 contrast; 5 = All text meets 4.5:1, tested with DevTools color picker / contrast audit on every label, input, dropdown, button, status chip
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots of light and dark mode inbox with ticket list + open ticket + reply form; DevTools Inspect > Accessibility > Contrast ratio pass/fail marks on representative elements

### AC-9: Chronological, wrap-friendly, scrollable message thread
- **Type**: `rule`
- **Given**: Ticket with 30 messages interleaved (user then admin then user...) across 2 hours, with multi-paragraph 2000-char messages containing long words and explicit line breaks
- **When**: Admin opens the ticket in Support Inbox at 375px width (mobile) and 1440px (desktop)
- **Then**: (a) messages render oldest first, newest last (sorted ascending by createdAt); (b) line breaks inside `msg.text` preserved exactly; (c) no container horizontally overflows; (d) entire thread fits vertically inside a scrollable region with independent scroll, no outer-body horizontal scrollbar; (e) admin message bubbles and user bubbles never clip text
- **Pass Condition**: Manual DOM inspection of message order (sort verified in devtools); no horizontal scroll on `window`; long words break/wrap naturally; scrollHeight of thread region > visible height so scroll is possible
- **Evidence**: DOM state inspection of sorted order; computed style of `overflow-wrap`/`white-space` on message text; visual screenshot of long conversation

### AC-10: Responsive layout (desktop side-by-side / mobile stacked)
- **Type**: `rule`
- **Given**: Admin logged in on 1440px wide desktop, 768px tablet, 375px mobile
- **When**: Support Inbox tab is rendered
- **Then**: (a) 1440px: inbox (left) + ticket details (right) appear side-by-side horizontally, each with own vertical scroll if overfull; (b) 768px and below: inbox and details are stacked vertically each at 100% width; (c) at no width does the grid cause a horizontal viewport scrollbar
- **Pass Condition**: Chrome responsive devtools emulation shows correct breakpoint behavior; `document.documentElement.scrollWidth === clientWidth` at all widths 360–2560
- **Evidence**: Screenshots of 3 widths; measured clientWidth/scrollWidth

### AC-11: Existing APIs & functionality preserved
- **Type**: `rule`
- **Given**: Existing frontend (unchanged consumers of userAPI.getUserById, notificationAPI.getNotifications, supportAPI.*)
- **When**: Every existing call site is exercised: view a profile, send a support reply, mark notifications read, filter tickets by status/category/search, update priority/notes, create ticket
- **Then**: All calls succeed with the same HTTP status codes they had before; no existing feature visibly regresses; response payloads are backward compatible (new additional fields tolerated, required old fields always present)
- **Pass Condition**: Smoke test script / manual checklist passes 100%; zero 400/500 that weren't happening before
- **Evidence**: Response diff of old vs new for 6 key endpoints; no payload contract breakage

### AC-12: Build, lint, tests green
- **Type**: `rule`
- **Given**: Clean checkout with npm deps installed
- **When**: Run `cd client && npx eslint src --max-warnings=0 --ext .js,.jsx` (or `npm run build` via react-scripts which runs lint), then `cd client && npm run build`, then `cd server && node -c server.js && node -e "require('./server.js')" 2>&1 | head -20` to ensure syntax OK, then any test scripts that exist (`client: npm test -- --watchAll=false; server: check tests/*`)
- **Then**: Lint passes with 0 errors; client build succeeds without warnings; server starts (or at least parses and all requires resolve); all existing tests pass
- **Pass Condition**: Exit code 0 for each step
- **Evidence**: Captured terminal output of each command

## Open Questions
- None. All behaviors have been scoped deterministically from the existing codebase.
