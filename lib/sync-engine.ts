import { localDb, type SyncQueueItem } from "./local-db";
import { createClient } from "@/lib/supabase/client";

const APP_STATE_ID = "00000000-0000-0000-0000-000000000001";

export async function enqueue(
	item: Omit<SyncQueueItem, "id" | "timestamp" | "attempts">,
) {
	await localDb.syncQueue.add({
		...item,
		timestamp: Date.now(),
		attempts: 0,
	});
}

export async function flushQueue(): Promise<void> {
	if (!navigator.onLine) return;

	const supabase = createClient();
	const items = await localDb.syncQueue.orderBy("timestamp").toArray();

	for (const item of items) {
		try {
			if (item.operation === "delete") {
				const { error } = await supabase
					.from(item.table)
					.delete()
					.eq("id", item.payload.id);
				if (error) throw error;
			} else if (item.operation === "upsert") {
				const { error } = await supabase.from(item.table).upsert(item.payload);
				if (error) throw error;
			} else if (item.operation === "update") {
				const { error } = await supabase
					.from(item.table)
					.update(item.payload)
					.eq("id", item.payload.id);
				if (error) throw error;
			} else if (item.operation === "insert") {
				const { error } = await supabase.from(item.table).insert(item.payload);
				if (error) throw error;
			}

			await localDb.syncQueue.delete(item.id!);
		} catch (err) {
			// Increment attempts; drop after 5 failures
			await localDb.syncQueue.update(item.id!, {
				attempts: item.attempts + 1,
			});
			if (item.attempts >= 5) {
				await localDb.syncQueue.delete(item.id!);
			}
		}
	}
}

// Wire up online event globally (call once in app root)
export function initSyncEngine() {
	window.addEventListener("online", () => {
		flushQueue();
	});

	// Also flush every 30s when online, to catch missed events
	setInterval(() => {
		if (navigator.onLine) flushQueue();
	}, 30_000);
}
