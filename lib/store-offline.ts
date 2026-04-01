import { localDb } from "./local-db";
import { enqueue } from "./sync-engine";
import { createClient } from "@/lib/supabase/client";
import type { Task, AppState, Pamphlet } from "@/lib/types";
import type { TagId } from "@/lib/tags";

const PAGE_SIZE = 12;

// ─── READ: Local first, Supabase fallback ────────────────────────────────────

export async function getActiveTasksOffline(
	pamphletId?: string | null,
): Promise<Task[]> {
	const local = await localDb.tasks
		.where("status")
		.anyOf(["active", "in-progress"])
		.and((t) => !pamphletId || t.pamphlet_id === pamphletId)
		.sortBy("page_number");

	if (local.length > 0) return local;

	// Fallback: fetch from Supabase and cache
	if (!navigator.onLine) return [];
	const supabase = createClient();
	const { data } = await supabase
		.from("tasks")
		.select("*")
		.in("status", ["active", "in-progress"])
		.order("page_number")
		.order("position");

	if (data) await localDb.tasks.bulkPut(data);
	return data || [];
}

export async function getCompletedTasksOffline(
	pamphletId: string,
	page: number = 1,
): Promise<Task[]> {
	// Always serve from local cache for completed
	const all = await localDb.tasks
		.where("status")
		.equals("completed")
		.and((t) => t.pamphlet_id === pamphletId)
		.reverse()
		.sortBy("completed_at");

	const from = (page - 1) * 50;
	return all.slice(from, from + 50);
}

export async function getAppStateOffline(): Promise<AppState> {
	const local = await localDb.appState.get(
		"00000000-0000-0000-0000-000000000001",
	);
	if (local) return local;

	if (!navigator.onLine) throw new Error("Offline and no cached app state");
	const supabase = createClient();
	const { data } = await supabase
		.from("app_state")
		.select("*")
		.eq("id", "00000000-0000-0000-0000-000000000001")
		.single();

	if (data) await localDb.appState.put(data);
	return data!;
}

// ─── WRITE: Local immediately + enqueue ─────────────────────────────────────

export async function addTaskOffline(task: Task): Promise<void> {
	await localDb.tasks.put(task);
	await enqueue({ operation: "insert", table: "tasks", payload: task });
}

export async function updateTaskOffline(
	id: string,
	updates: Partial<Task>,
): Promise<void> {
	await localDb.tasks.update(id, {
		...updates,
		updated_at: new Date().toISOString(),
	});
	await enqueue({
		operation: "update",
		table: "tasks",
		payload: { id, ...updates, updated_at: new Date().toISOString() },
	});
}

export async function deleteTaskOffline(id: string): Promise<void> {
	await localDb.tasks.delete(id);
	await enqueue({ operation: "delete", table: "tasks", payload: { id } });
}

export async function markTaskDoneOffline(
	taskId: string,
	totalTimeMs: number,
	pamphletId: string | null,
): Promise<void> {
	const now = new Date().toISOString();

	await localDb.tasks.update(taskId, {
		status: "completed",
		completed_at: now,
		total_time_ms: totalTimeMs,
		updated_at: now,
	});

	// Re-index remaining active tasks locally
	const remaining = await localDb.tasks
		.where("status")
		.anyOf(["active", "in-progress"])
		.and((t) => t.pamphlet_id === pamphletId)
		.sortBy("page_number");

	for (const [i, task] of remaining.entries()) {
		await localDb.tasks.update(task.id, {
			page_number: Math.floor(i / PAGE_SIZE) + 1,
			position: i % PAGE_SIZE,
		});
	}

	await enqueue({
		operation: "update",
		table: "tasks",
		payload: {
			id: taskId,
			status: "completed",
			completed_at: now,
			total_time_ms: totalTimeMs,
			updated_at: now,
		},
	});
}

export async function updateAppStateOffline(
	updates: Partial<AppState>,
): Promise<void> {
	const id = "00000000-0000-0000-0000-000000000001";
	await localDb.appState.update(id, {
		...updates,
		updated_at: new Date().toISOString(),
	});
	await enqueue({
		operation: "update",
		table: "app_state",
		payload: { id, ...updates, updated_at: new Date().toISOString() },
	});
}

// ─── SEED: Pull everything from Supabase into IndexedDB ─────────────────────

export async function seedLocalCache(pamphletId: string | null): Promise<void> {
	if (!navigator.onLine) return;
	const supabase = createClient();

	const [tasks, appState, pamphlets] = await Promise.all([
		supabase.from("tasks").select("*").eq("pamphlet_id", pamphletId),
		supabase
			.from("app_state")
			.select("*")
			.eq("id", "00000000-0000-0000-0000-000000000001")
			.single(),
		supabase.from("pamphlets").select("*").order("position"),
	]);

	if (tasks.data) await localDb.tasks.bulkPut(tasks.data);
	if (appState.data) await localDb.appState.put(appState.data);
	if (pamphlets.data) await localDb.pamphlets.bulkPut(pamphlets.data);
}

export async function getPamphletsOffline(): Promise<Pamphlet[]> {
	const local = await localDb.pamphlets.orderBy("position").toArray();
	if (local.length > 0) return local;

	if (!navigator.onLine) return [];
	const supabase = createClient();
	const { data } = await supabase
		.from("pamphlets")
		.select("*")
		.order("position");

	if (data) await localDb.pamphlets.bulkPut(data);
	return data || [];
}

export async function getAllActiveTasksOffline(): Promise<Task[]> {
	const local = await localDb.tasks
		.where("status")
		.anyOf(["active", "in-progress"])
		.sortBy("page_number");

	if (local.length > 0) return local;

	if (!navigator.onLine) return [];
	const supabase = createClient();
	const { data } = await supabase
		.from("tasks")
		.select("*")
		.in("status", ["active", "in-progress"])
		.order("page_number")
		.order("position");

	if (data) await localDb.tasks.bulkPut(data);
	return data || [];
}

export async function getTasksWithNotesOffline(): Promise<Task[]> {
	const local = await localDb.tasks
		.where("status")
		.equals("completed")
		.filter((t) => !!t.note && t.note !== "")
		.reverse()
		.sortBy("completed_at");

	if (local.length > 0) return local;

	if (!navigator.onLine) return [];
	const supabase = createClient();
	const { data } = await supabase
		.from("tasks")
		.select("*")
		.eq("status", "completed")
		.not("note", "is", null)
		.neq("note", "")
		.order("completed_at", { ascending: false });

	if (data) await localDb.tasks.bulkPut(data);
	return data || [];
}

export async function getTotalPageCountOffline(
	pamphletId: string | null,
): Promise<number> {
	if (!pamphletId) return 1;

	const tasks = await localDb.tasks
		.where("status")
		.anyOf(["active", "in-progress"])
		.and((t) => t.pamphlet_id === pamphletId)
		.toArray();

	if (tasks.length === 0) return 1;
	return Math.max(...tasks.map((t) => t.page_number));
}
