import useSWR from "swr";
import {
	getHabits,
	updateHabit,
	addHabit,
	deleteHabit,
	toggleCompletion,
	getToday,
	type Habit,
} from "@/lib/habits";
import { useCallback } from "react";
import { useUserId } from "./use-user-id";

export function useHabits() {
	const userId = useUserId();

	const {
		data: habits = [],
		mutate,
		isLoading,
	} = useSWR<Habit[]>(userId ? `habits-${userId}` : null, getHabits, {
		refreshInterval: 0,
	});

	const handleUpdate = useCallback(
		async (id: string, updates: Partial<Habit>) => {
			mutate(
				habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
				false,
			);
			await updateHabit(id, updates);
			await mutate();
		},
		[habits, mutate],
	);

	const handleAdd = useCallback(
		async (
			habit: Omit<Habit, "id" | "created_at" | "updated_at" | "completions">,
		) => {
			await addHabit(habit);
			await mutate();
		},
		[mutate],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			mutate(
				habits.filter((h) => h.id !== id),
				false,
			);
			await deleteHabit(id);
			await mutate();
		},
		[habits, mutate],
	);

	const handleToggleToday = useCallback(
		async (id: string) => {
			const habit = habits.find((h) => h.id === id);
			if (!habit) return;

			const today = getToday();
			const wasCompleted = habit.completions.includes(today);

			// Optimistic update
			mutate(
				habits.map((h) => {
					if (h.id !== id) return h;
					const newCompletions = wasCompleted
						? h.completions.filter((d) => d !== today)
						: [...h.completions, today];
					return { ...h, completions: newCompletions };
				}),
				false,
			);

			await toggleCompletion(id, today, habit.completions);
			await mutate();
		},
		[habits, mutate],
	);

	const handleStatusChange = useCallback(
		async (id: string, status: Habit["status"]) => {
			await handleUpdate(id, { status });
		},
		[handleUpdate],
	);

	return {
		habits,
		isLoading,
		handleUpdate,
		handleAdd,
		handleDelete,
		handleToggleToday,
		handleStatusChange,
	};
}
