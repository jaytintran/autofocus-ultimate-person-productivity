import { useState, useCallback } from "react";
import type { Task } from "@/lib/types";

interface UseSidequestProps {
	activeTasks: Task[];
	effectiveWorkingTask: Task | null;
	onCompleteAdjacentTask: (taskId: string | null, text: string) => Promise<void>;
	onSidequestComplete: (text: string) => void;
}

export function useSidequest({
	activeTasks,
	effectiveWorkingTask,
	onCompleteAdjacentTask,
	onSidequestComplete,
}: UseSidequestProps) {
	const [sidequestInput, setSidequestInput] = useState("");
	const [sidequestMatches, setSidequestMatches] = useState<Task[]>([]);
	const [sidequestSubmitting, setSidequestSubmitting] = useState(false);

	const handleSidequestChange = useCallback(
		(value: string) => {
			setSidequestInput(value);
			if (value.trim()) {
				setSidequestMatches(
					activeTasks
						.filter(
							(t) =>
								t.text.toLowerCase().includes(value.toLowerCase()) &&
								t.id !== effectiveWorkingTask?.id,
						)
						.slice(0, 5),
				);
			} else {
				setSidequestMatches([]);
			}
		},
		[activeTasks, effectiveWorkingTask],
	);

	const handleSidequestSubmit = useCallback(
		async (taskId: string | null, text: string) => {
			const trimmed = text.trim();
			if (!trimmed || sidequestSubmitting) return;
			setSidequestSubmitting(true);
			try {
				await onCompleteAdjacentTask(taskId, trimmed);
				onSidequestComplete(trimmed);
				setSidequestInput("");
				setSidequestMatches([]);
			} finally {
				setSidequestSubmitting(false);
			}
		},
		[sidequestSubmitting, onCompleteAdjacentTask, onSidequestComplete],
	);

	const clearSidequest = useCallback(() => {
		setSidequestInput("");
		setSidequestMatches([]);
	}, []);

	return {
		sidequestInput,
		sidequestMatches,
		sidequestSubmitting,
		handleSidequestChange,
		handleSidequestSubmit,
		clearSidequest,
	};
}
