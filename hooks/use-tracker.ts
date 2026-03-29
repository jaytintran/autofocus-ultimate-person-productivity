import { useState, useCallback } from "react";
import useSWR from "swr";
import {
	getTrackers,
	createTracker,
	updateTracker,
	completeTracker,
	uncompleteTracker,
	deleteTracker,
	getTasksForTracker,
	type Tracker,
	type TrackerType,
} from "@/lib/store";
import type { Task } from "@/lib/types";

export function useTracker() {
	const {
		data: trackers = [],
		mutate,
		isLoading,
	} = useSWR<Tracker[]>("trackers", getTrackers, {
		refreshInterval: 0,
	});

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [trackerTasks, setTrackerTasks] = useState<Map<string, Task[]>>(
		new Map(),
	);
	const [loadingTasksFor, setLoadingTasksFor] = useState<Set<string>>(
		new Set(),
	);

	const invalidate = useCallback(() => mutate(), [mutate]);

	const handleCreate = useCallback(
		async (name: string, type: TrackerType) => {
			await createTracker(name, type);
			await mutate();
		},
		[mutate],
	);

	const handleUpdate = useCallback(
		async (id: string, updates: Partial<Pick<Tracker, "name" | "type">>) => {
			await updateTracker(id, updates);
			await mutate();
		},
		[mutate],
	);

	const handleComplete = useCallback(
		async (id: string) => {
			await completeTracker(id);
			await mutate();
		},
		[mutate],
	);

	const handleUncomplete = useCallback(
		async (id: string) => {
			await uncompleteTracker(id);
			await mutate();
		},
		[mutate],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			await deleteTracker(id);
			setTrackerTasks((prev) => {
				const next = new Map(prev);
				next.delete(id);
				return next;
			});
			if (expandedId === id) setExpandedId(null);
			await mutate();
		},
		[mutate, expandedId],
	);

	const handleToggleExpand = useCallback(
		async (id: string) => {
			if (expandedId === id) {
				setExpandedId(null);
				return;
			}
			setExpandedId(id);
			if (!trackerTasks.has(id)) {
				setLoadingTasksFor((prev) => new Set(prev).add(id));
				try {
					const tasks = await getTasksForTracker(id);
					setTrackerTasks((prev) => new Map(prev).set(id, tasks));
				} finally {
					setLoadingTasksFor((prev) => {
						const next = new Set(prev);
						next.delete(id);
						return next;
					});
				}
			}
		},
		[expandedId, trackerTasks],
	);

	const refreshTrackerTasks = useCallback(async (trackerId: string) => {
		const tasks = await getTasksForTracker(trackerId);
		setTrackerTasks((prev) => new Map(prev).set(trackerId, tasks));
	}, []);

	return {
		trackers,
		isLoading,
		expandedId,
		trackerTasks,
		loadingTasksFor,
		invalidate,
		handleCreate,
		handleUpdate,
		handleComplete,
		handleUncomplete,
		handleDelete,
		handleToggleExpand,
		refreshTrackerTasks,
	};
}
