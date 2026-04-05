# Offline Functionality Fixes - Approved Plan Breakdown

Current Progress: 16/18 steps complete

## Phase 1: Core IDB & Offline Guard (2 steps)

- [x] 1.1 lib/db.ts: Add app_state table to Dexie schema (w/ stores: "user_id, timer_state")
- [x] 1.2 lib/offline-guard.ts: Export isOnline for UI/components

## Phase 2: AppState Offline Support (5 steps) - COMPLETE

- [x] 2.1 lib/store.ts: Implement getAppState() IDB fallback + default OFFLINE_APP_STATE
- [x] 2.2 lib/store.ts: Add updateAppState() offline IDB + queueWrite
- [x] 2.3 lib/store.ts: Add offline/timer funcs (startWorkingOnTask etc.) w/ IDB/queue
- [x] 2.4 lib/sync.ts: Update sync queue handling for app_state table
- [x] 2.5 components/autofocus-app.tsx: SWR appState fallbackData + offline indicator

## Phase 3: Sync Enhancements (4 steps) - COMPLETE

- [x] 3.1 lib/sync.ts: Include app_state in refreshAllCaches() & flushSyncQueue()
- [x] 3.2 lib/sync.ts: Add retry logic (3 attempts, backoff) in flushSyncQueue
- [x] 3.3 lib/sync.ts: Add periodic poll (30s online) + 'focus'/'visibilitychange' sync
- [x] 3.4 lib/sync.ts: Enhanced listener w/ all triggers

## Phase 4 COMPLETE

- [x] 4.1 Seed removed
- [x] 4.2 SWR fallbackData
- [x] 4.3 Offline toast indicator
- [x] 4.4 refreshAllCaches mount + sync listener

## Phase 5: Testing & Polish (3 steps)

- [ ] 5.1 Test: npm run dev → offline CRUD/timer → reconnect sync verification
- [ ] 5.2 Edge: Manual Supabase edits → offline refresh; queue backlog handling
- [ ] 5.3 Cleanup: Update this TODO w/ completions; attempt_completion

**Next Step**: 1.1 lib/db.ts schema update
