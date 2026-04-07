import type { Task, Pamphlet } from "@/lib/types";

const CACHE_PREFIX = "af4:pamphlet:";
const ACTIVE_PAMPHLET_KEY = "af4:active-pamphlet-id";

// =============================================================================
// ACTIVE PAMPHLET
// =============================================================================

export function getActivePamphletId(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(ACTIVE_PAMPHLET_KEY);
}

export function setActivePamphletId(id: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(ACTIVE_PAMPHLET_KEY, id);
}

// =============================================================================
// TASK CACHE PER PAMPHLET
// =============================================================================

function cacheKey(pamphletId: string): string {
	return `${CACHE_PREFIX}${pamphletId}:tasks`;
}

export function getCachedTasks(pamphletId: string): Task[] | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(cacheKey(pamphletId));
		if (!raw) return null;
		return JSON.parse(raw) as Task[];
	} catch {
		return null;
	}
}

export function setCachedTasks(pamphletId: string, tasks: Task[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(cacheKey(pamphletId), JSON.stringify(tasks));
	} catch {}
}

export function invalidatePamphletCache(pamphletId: string): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(cacheKey(pamphletId));
}

export function invalidateAllPamphletCaches(): void {
	if (typeof window === "undefined") return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
	}
	keysToRemove.forEach((k) => localStorage.removeItem(k));
}
