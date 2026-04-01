import Dexie, { type Table } from "dexie";
import type { Task, AppState, Pamphlet } from "@/lib/types";

export interface SyncQueueItem {
	id?: number;
	operation: "insert" | "update" | "delete" | "upsert";
	table: "tasks" | "app_state" | "pamphlets";
	payload: Record<string, any>;
	timestamp: number;
	attempts: number;
}

class AF4Database extends Dexie {
	tasks!: Table<Task>;
	appState!: Table<AppState>;
	pamphlets!: Table<Pamphlet>;
	syncQueue!: Table<SyncQueueItem>;

	constructor() {
		super("af4-offline");
		this.version(1).stores({
			tasks: "id, status, pamphlet_id, page_number, position, completed_at",
			appState: "id",
			pamphlets: "id, position",
			syncQueue: "++id, table, timestamp, attempts",
		});
	}
}

export const localDb = new AF4Database();
