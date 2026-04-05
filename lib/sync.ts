import { db } from "@/lib/db";
import { APP_STATE_ID } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const POLL_INTERVAL_MS = 30000;

let pollInterval: NodeJS.Timeout | null = null;

export async function refreshAllCaches(): Promise<void> {
	if (!navigator.onLine) return;

	const supabase = createClient();

	const [tasks, habits, books, projects, pamphlets, appState] =
		await Promise.all([
			supabase.from("tasks").select("*"),
			supabase.from("habits").select("*"),
			supabase.from("books").select("*"),
			supabase.from("projects").select("*"),
			supabase.from("pamphlets").select("*"),
			supabase.from("app_state").select("*"),
		]);

	// Normalise app_state rows: override the Supabase-generated UUID with the
	// stable local key so that db.app_state.get(APP_STATE_ID) always works.
	const normalisedAppState = (appState.data || []).map((row) => ({
		...row,
		id: APP_STATE_ID,
	}));

	await Promise.all([
		db.tasks.clear().then(() => db.tasks.bulkPut(tasks.data || [])),
		db.habits.clear().then(() => db.habits.bulkPut(habits.data || [])),
		db.books.clear().then(() => db.books.bulkPut(books.data || [])),
		db.projects.clear().then(() => db.projects.bulkPut(projects.data || [])),
		db.pamphlets.clear().then(() => db.pamphlets.bulkPut(pamphlets.data || [])),
		db.app_state.clear().then(() => db.app_state.bulkPut(normalisedAppState)),
	]);
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function flushSyncQueue(): Promise<void> {
	const items = await db.sync_queue.orderBy("timestamp").toArray();
	if (items.length === 0) return;

	const supabase = createClient();

	for (const item of items) {
		let attempt = 0;
		let success = false;

		while (attempt < MAX_RETRIES && !success) {
			try {
				const payload = item.payload as Record<string, unknown>;
				if (item.action === "insert") {
					await supabase.from(item.table).insert(payload);
				} else if (item.action === "update") {
					const { id, ...updates } = payload;
					await supabase
						.from(item.table)
						.update(updates)
						.eq("id", id as string);
				} else if (item.action === "delete") {
					await supabase
						.from(item.table)
						.delete()
						.eq("id", payload.id as string);
				}
				await db.sync_queue.delete(item.id!);
				success = true;
			} catch (e) {
				attempt++;
				if (attempt < MAX_RETRIES) {
					await sleep(RETRY_DELAY_MS * attempt);
				} else {
					console.error(`Sync failed for item ${item.id}:`, e);
					break;
				}
			}
		}

		if (!success) break;
	}
}

async function syncCycle(): Promise<void> {
	if (!navigator.onLine) return;
	try {
		await flushSyncQueue();
		await refreshAllCaches();
	} catch (e) {
		console.error("Sync cycle failed:", e);
	}
}

export async function startSyncListener(): Promise<void> {
	if (typeof window === "undefined") return;

	// Online/offline events
	window.addEventListener("online", syncCycle);

	// Visibility change
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && navigator.onLine) {
			syncCycle();
		}
	});

	// Window focus
	window.addEventListener("focus", () => {
		if (navigator.onLine) {
			syncCycle();
		}
	});

	// Periodic poll when online
	if (pollInterval) clearInterval(pollInterval);
	pollInterval = setInterval(() => {
		if (navigator.onLine) {
			syncCycle();
		}
	}, POLL_INTERVAL_MS);

	// Initial sync
	if (navigator.onLine) {
		await syncCycle();
	}
}
