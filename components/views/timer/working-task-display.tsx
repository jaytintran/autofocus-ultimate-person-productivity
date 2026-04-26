"use client";

import { X } from "lucide-react";
import type { Task, Pamphlet } from "@/lib/types";
import { formatDueDate } from "@/lib/utils/due-date-parser";
import { PAMPHLET_COLORS } from "@/lib/features/pamphlet-colors";
import { TagPill } from "@/components/shared/tag-pill";
import { DueDatePicker } from "./due-date-picker";
import { TimerActionButtons } from "./timer-action-buttons";
import { formatTimerDisplay, iconBtn } from "./timer-bar.utils";
import type { TagId } from "@/lib/tags";

interface WorkingTaskDisplayProps {
	effectiveWorkingTask: Task;
	totalDisplayTime: number;
	isRunning: boolean;
	timerState: "idle" | "running" | "paused" | "stopped";
	isReentering: boolean;
	pamphlets: Pamphlet[];
	dueDatePickerOpen: boolean;
	setDueDatePickerOpen: (open: boolean) => void;
	onCancelTask: () => void;
	onUpdateDueDate: (taskId: string, dueDate: string | null) => Promise<void>;
	onUpdateTaskTag: (taskId: string, tag: TagId | null) => Promise<void>;
	onStartTimer: () => void;
	onPause: () => void;
	onResume: () => void;
	onStop: () => void;
	onComplete: () => void;
	onReenter: () => void;
	onResetTime: () => void;
}

export function WorkingTaskDisplay({
	effectiveWorkingTask,
	totalDisplayTime,
	isRunning,
	timerState,
	isReentering,
	pamphlets,
	dueDatePickerOpen,
	setDueDatePickerOpen,
	onCancelTask,
	onUpdateDueDate,
	onUpdateTaskTag,
	onStartTimer,
	onPause,
	onResume,
	onStop,
	onComplete,
	onReenter,
	onResetTime,
}: WorkingTaskDisplayProps) {
	const workingPamphlet =
		pamphlets.find((p) => p.id === effectiveWorkingTask.pamphlet_id) ?? null;

	return (
		<div className="flex flex-col gap-3">
			{/* Title + X */}
			<div className="flex items-start justify-between gap-3">
				<p className="text-base font-semibold tracking-tight text-foreground md:text-2xl md:tracking-[0.04em]">
					{effectiveWorkingTask.text}
				</p>
				<button
					onClick={onCancelTask}
					className={iconBtn}
					title="Remove from working panel"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Badges row */}
			<div className="flex items-center gap-2 flex-wrap">
				{workingPamphlet && (
					<span
						className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.15em] ${PAMPHLET_COLORS[workingPamphlet.color].bg} ${PAMPHLET_COLORS[workingPamphlet.color].text} ${PAMPHLET_COLORS[workingPamphlet.color].border} border`}
					>
						{workingPamphlet.name}
					</span>
				)}

				{/* Due date chip */}
				<div className="relative">
					<button
						onClick={() => setDueDatePickerOpen(!dueDatePickerOpen)}
						className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border transition-colors
                    ${
											effectiveWorkingTask.due_date
												? (() => {
														const { urgency } = formatDueDate(
															effectiveWorkingTask.due_date,
														);
														const urgencyClasses: Record<string, string> = {
															overdue:
																"border-red-500/40 bg-red-500/10 text-red-500",
															soon: "border-amber-500/40 bg-amber-500/10 text-amber-500",
															normal:
																"border-muted-foreground/30 bg-muted/50 text-muted-foreground",
															far: "border-muted-foreground/20 bg-transparent text-muted-foreground/50",
														};
														return urgencyClasses[urgency];
													})()
												: "border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-muted-foreground/60 hover:text-muted-foreground"
										}`}
					>
						{effectiveWorkingTask.due_date
							? `⏰ ${formatDueDate(effectiveWorkingTask.due_date).label}`
							: "+ due date"}
					</button>
					{dueDatePickerOpen && (
						<DueDatePicker
							currentDueDate={effectiveWorkingTask.due_date}
							onSet={(isoDate) =>
								onUpdateDueDate(effectiveWorkingTask.id, isoDate)
							}
							onClose={() => setDueDatePickerOpen(false)}
						/>
					)}
				</div>

				{/* Tag pill */}
				<TagPill
					tagId={effectiveWorkingTask.tag}
					onSelectTag={(tag) => onUpdateTaskTag(effectiveWorkingTask.id, tag)}
					className="scale-90 origin-left"
				/>
			</div>

			{/* Timer + action buttons */}
			<div className="flex items-center justify-between gap-3 md:flex-col md:items-start md:gap-3">
				{/* Timer */}
				<span
					className={`font-mono text-xl tracking-[0.12em] md:text-4xl md:tracking-[0.16em] ${isRunning ? "text-af4-highlight" : "text-foreground"}`}
				>
					{formatTimerDisplay(totalDisplayTime)}
				</span>

				{/* Action buttons */}
				<TimerActionButtons
					timerState={timerState}
					effectiveWorkingTask={effectiveWorkingTask}
					isReentering={isReentering}
					onStartTimer={onStartTimer}
					onPause={onPause}
					onResume={onResume}
					onStop={onStop}
					onComplete={onComplete}
					onReenter={onReenter}
					onResetTime={onResetTime}
				/>
			</div>
		</div>
	);
}
