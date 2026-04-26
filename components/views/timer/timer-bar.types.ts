import type { Task, AppState, Pamphlet } from "@/lib/types";
import type { TagId } from "@/lib/tags";

export interface NoteEntry {
	id: string;
	elapsedMs: number;
	text: string;
	type: "log" | "achievement" | "sidequest";
}

export interface TimerBarProps {
	appState: AppState;
	workingTask: Task | null;
	onStartTimer: () => Promise<void>;
	onPauseTimer: (sessionMs: number) => Promise<void>;
	onResumeTimer: () => Promise<void>;
	onStopTimer: (task: Task, sessionMs: number) => Promise<void>;
	onCancelTask: (task: Task, sessionMs: number) => Promise<void>;
	onCompleteTask: (
		task: Task,
		sessionMs: number,
		note: string,
	) => Promise<void>;
	onReenterTask: (task: Task, note?: string) => Promise<void>;
	onAddTask: (text: string, tag?: TagId | null) => Promise<Task | null>;
	onStartTask: (task: Task) => Promise<void>;
	activeTasks: Task[];
	onAddTaskAndStart: (
		text: string,
		tag?: TagId | null,
		dueDate?: string | null,
	) => Promise<Task | null>;
	pamphlets: Pamphlet[];
	onUpdateDueDate: (taskId: string, dueDate: string | null) => Promise<void>;
	onUpdateTaskTag: (taskId: string, tag: TagId | null) => Promise<void>;
	onCompleteAdjacentTask: (
		taskId: string | null,
		text: string,
	) => Promise<void>;
	onResetTime: (taskId: string) => Promise<void>;
}
