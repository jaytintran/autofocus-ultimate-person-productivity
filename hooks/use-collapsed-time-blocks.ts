import { useState, useCallback } from "react";

export function useCollapsedTimeBlocks() {
	const STORAGE_KEY = "af4-collapsed-blocks";

	const [collapsed, setCollapsed] = useState<Set<string>>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? new Set(JSON.parse(stored)) : new Set();
		} catch {
			return new Set();
		}
	});

	const toggle = useCallback((key: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
			} catch {}
			return next;
		});
	}, []);

	const isCollapsed = useCallback(
		(key: string) => collapsed.has(key),
		[collapsed],
	);

	return { isCollapsed, toggle };
}
