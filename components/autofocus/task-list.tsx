"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { GripVertical, Play, Check, RefreshCw, Trash2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { updateTask } from "@/lib/store";
import { formatTimeCompact } from "./timer-bar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface TaskListProps {
	tasks: Task[];
	allTasks: Task[]; // All active tasks for cross-page reordering
	workingTaskId: string | null;
	onRefresh: () => void;
	onStartTask: (task: Task) => Promise<void>;
	onDoneTask: (task: Task) => Promise<void>;
	onDeleteTask: (taskId: string) => Promise<void>;
	onReenterTask: (task: Task) => Promise<void>;
	onReorderTasks: (
		draggedTaskId: string,
		dropTargetId: string,
	) => Promise<void>;
	onSwitchTask: (
		newTask: Task,
		action: "complete" | "reenter",
	) => Promise<void>;
	onVisibleCapacityChange?: (capacity: number) => void;
}

const FALLBACK_TASK_ROW_HEIGHT = 48;

interface TaskRowProps {
	task: Task;
	isWorking: boolean;
	workingTask: Task | null;
	onStart: (task: Task) => void;
	onDone: (task: Task) => void;
	onReenter: (task: Task) => void;
	onDelete: (taskId: string) => void;
	onUpdateText: (taskId: string, newText: string) => void;
	onSwitchTask: (
		newTask: Task,
		action: "complete" | "reenter",
	) => Promise<void>;
	onDragStart: (e: React.DragEvent, task: Task) => void;
	onDragOver: (e: React.DragEvent, task: Task) => void;
	onDragEnd: () => void;
	onTouchStart: (e: React.TouchEvent, task: Task) => void;
	onTouchMove: (e: React.TouchEvent) => void;
	onTouchEnd: () => void;
	isDragging: boolean;
	isDropTarget: boolean;
	disabled: boolean;
}

function TaskRow({
	task,
	isWorking,
	workingTask,
	onStart,
	onDone,
	onReenter,
	onDelete,
	onUpdateText,
	onSwitchTask,
	onDragStart,
	onDragOver,
	onDragEnd,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	isDragging,
	isDropTarget,
	disabled,
}: TaskRowProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(task.text);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [modalEditText, setModalEditText] = useState(task.text);
	const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
	const [pendingTask, setPendingTask] = useState<Task | null>(null);
	const [longPressActive, setLongPressActive] = useState(false);
	const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
	const reenterButtonRef = useRef<HTMLButtonElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const spanRef = useRef<HTMLSpanElement>(null);

	const handleTouchStartWithDelay = (e: React.TouchEvent) => {
		if (isWorking || disabled) return;

		longPressTimerRef.current = setTimeout(() => {
			setLongPressActive(true);
			onTouchStart(e, task);
		}, 1000);
	};

	const handleTouchMoveWithDelay = (e: React.TouchEvent) => {
		if (!longPressActive) {
			// Cancel long press if user moves before 1 second
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
				longPressTimerRef.current = null;
			}
			return;
		}
		onTouchMove(e);
	};

	const handleTouchEndWithDelay = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
		if (longPressActive) {
			setLongPressActive(false);
			onTouchEnd();
		}
	};

	useEffect(() => {
		return () => {
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	useEffect(() => {
		if (showSwitchConfirm) {
			reenterButtonRef.current?.focus();
		}
	}, [showSwitchConfirm]);

	const isTextOverflowing = () => {
		if (!spanRef.current) return false;
		return spanRef.current.scrollWidth > spanRef.current.clientWidth;
	};

	const handleTextClick = (e: React.MouseEvent) => {
		if (isWorking) return;
		e.stopPropagation();

		if (isTextOverflowing()) {
			setModalEditText(task.text);
			setShowModal(true);
		} else {
			setEditText(task.text);
			setIsEditing(true);
		}
	};

	const handleModalSave = () => {
		const trimmed = modalEditText.trim();
		if (trimmed && trimmed !== task.text) {
			onUpdateText(task.id, trimmed);
		}
		setShowModal(false);
	};

	const handleSave = () => {
		const trimmed = editText.trim();
		if (trimmed && trimmed !== task.text) {
			onUpdateText(task.id, trimmed);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setEditText(task.text);
			setIsEditing(false);
		}
	};

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (showDeleteConfirm) {
			onDelete(task.id);
			setShowDeleteConfirm(false);
		} else {
			setShowDeleteConfirm(true);
			// Auto-hide after 3 seconds
			setTimeout(() => setShowDeleteConfirm(false), 3000);
		}
	};

	const handleStartClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (workingTask && workingTask.id !== task.id) {
			setPendingTask(task);
			setShowSwitchConfirm(true);
		} else {
			onStart(task);
		}
	};

	const handleSwitchComplete = async () => {
		setShowSwitchConfirm(false);
		if (pendingTask) {
			await onSwitchTask(pendingTask, "complete");
			setPendingTask(null);
		}
	};

	const handleSwitchReenter = async () => {
		setShowSwitchConfirm(false);
		if (pendingTask) {
			await onSwitchTask(pendingTask, "reenter");
			setPendingTask(null);
		}
	};

	return (
		<>
			<li
				data-task-id={task.id}
				draggable={!isWorking && !isEditing}
				onDragStart={(e) => onDragStart(e, task)}
				onDragOver={(e) => onDragOver(e, task)}
				onDragEnd={onDragEnd}
				onTouchStart={handleTouchStartWithDelay}
				onTouchMove={handleTouchMoveWithDelay}
				onTouchEnd={handleTouchEndWithDelay}
				className={`
					group px-4 py-2.5 flex items-center gap-2
					touch-none
					${isWorking ? "bg-[#8b9a6b]/15 border-l-2 border-[#8b9a6b]" : ""}
					${isDragging || longPressActive ? "opacity-50 bg-accent" : ""}
					${isDropTarget ? "border-t-2 border-[#8b9a6b]" : ""}
					transition-colors
				`}
			>
				{/* Drag handle */}
				<div
					className={`
						cursor-grab active:cursor-grabbing text-muted-foreground
						${isWorking ? "opacity-30" : "opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"}
						transition-opacity flex-shrink-0
					`}
				>
					<GripVertical className="w-4 h-4" />
				</div>

				{/* Task text - clickable area to edit task */}
				<div className="flex-1 min-w-0 flex items-center gap-2">
					{isEditing ? (
						<input
							ref={inputRef}
							type="text"
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							onBlur={handleSave}
							onKeyDown={handleKeyDown}
							onClick={(e) => e.stopPropagation()}
							className="flex-1 bg-transparent border-b border-[#8b9a6b] outline-none py-0.5 text-foreground"
						/>
					) : (
						<span
							ref={spanRef}
							onClick={handleTextClick}
							className={`
								truncate cursor-text
								${isWorking ? "text-[#ddd4b8]" : ""}
							`}
						>
							{task.text}
						</span>
					)}
				</div>

				{/* Right side: badges and action buttons */}
				<div className="flex items-center gap-1.5 flex-shrink-0">
					{/* Re-entered badge */}
					{task.re_entered_from && !isEditing && (
						<span className="text-[10px] px-1.5 py-0.5 rounded border border-[#c49a6b]/40 bg-[#c49a6b]/10 text-[#c49a6b] flex-shrink-0">
							re-entered
						</span>
					)}

					{/* Time spent badge */}
					{task.total_time_ms > 0 && !isEditing && (
						<span className="text-[10px] px-1.5 py-0.5 rounded border border-muted-foreground/30 bg-muted/50 text-muted-foreground flex-shrink-0">
							{formatTimeCompact(task.total_time_ms)}
						</span>
					)}

					{/* Action buttons */}
					{!isWorking && !isEditing && (
						<div className="flex items-center gap-1 flex-shrink-0">
							{/* Start button */}
							<button
								onClick={handleStartClick}
								className="p-1.5 hover:bg-accent rounded transition-colors"
								title="Start working on this task"
							>
								<Play className="w-3.5 h-3.5 text-[#8b9a6b]" />
							</button>

							{/* Done button */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									onDone(task);
								}}
								className="p-1.5 hover:bg-accent rounded transition-colors"
								title="Mark as done"
							>
								<Check className="w-3.5 h-3.5 text-[#8b9a6b]" />
							</button>

							{/* Re-enter button */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									onReenter(task);
								}}
								className="p-1.5 hover:bg-accent rounded transition-colors"
								title="Re-enter at end of list"
							>
								<RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
							</button>

							{/* Delete button */}
							{showDeleteConfirm ? (
								<button
									onClick={handleDeleteClick}
									className="px-2 py-1 text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 rounded transition-colors"
								>
									Yes
								</button>
							) : (
								<button
									onClick={handleDeleteClick}
									className="p-1.5 hover:bg-accent rounded transition-colors"
									title="Delete task"
								>
									<Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
								</button>
							)}
						</div>
					)}
				</div>
			</li>

			{/* Modal for editing long text */}
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="sm:max-w-[500px] top-[20%] sm:top-[50%] translate-y-[-20%] sm:translate-y-[-50%]">
					<DialogHeader>
						<DialogTitle>Edit Task</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<textarea
							value={modalEditText}
							onChange={(e) => setModalEditText(e.target.value)}
							className="w-full min-h-[120px] bg-transparent border border-[#8b9a6b] rounded-md p-3 outline-none text-foreground resize-none"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey) {
									handleModalSave();
								} else if (e.key === "Escape") {
									setShowModal(false);
								}
							}}
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowModal(false)}
								className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleModalSave}
								className="px-4 py-2 text-sm bg-[#8b9a6b] text-background hover:bg-[#8b9a6b]/90 rounded transition-colors"
							>
								Save
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Switch task confirmation dialog */}
			<Dialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Switch Tasks?</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						You're currently working on "{workingTask?.text}". What would you
						like to do with it?
					</p>
					<div className="flex gap-2 justify-end mt-4">
						<button
							type="button"
							onClick={() => setShowSwitchConfirm(false)}
							disabled={disabled}
							className="px-4 py-2 text-sm border rounded hover:bg-accent transition-colors"
						>
							Cancel
						</button>
						<button
							ref={reenterButtonRef}
							type="button"
							onClick={() => void handleSwitchReenter()}
							disabled={disabled}
							className="px-4 py-2 text-sm bg-[#c49a6b] text-white rounded hover:bg-[#c49a6b]/90 transition-colors"
						>
							Re-enter at End
						</button>
						<button
							type="button"
							onClick={() => void handleSwitchComplete()}
							disabled={disabled}
							className="px-4 py-2 text-sm bg-[#8b9a6b] text-white rounded hover:bg-[#8b9a6b]/90 transition-colors"
						>
							Mark as Completed
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function TaskList({
	tasks,
	allTasks,
	workingTaskId,
	onRefresh,
	onStartTask,
	onDoneTask,
	onDeleteTask,
	onReenterTask,
	onReorderTasks,
	onSwitchTask,
	onVisibleCapacityChange,
}: TaskListProps) {
	const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
	const [draggedTask, setDraggedTask] = useState<Task | null>(null);
	const [dropTargetId, setDropTargetId] = useState<string | null>(null);
	const [touchStartY, setTouchStartY] = useState<number | null>(null);
	const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const workingTask = allTasks.find((t) => t.id === workingTaskId) || null;

	useEffect(() => {
		if (!onVisibleCapacityChange) return;

		const calculateVisibleCapacity = () => {
			const container = containerRef.current;
			if (!container) return;

			const firstTaskRow =
				listRef.current?.querySelector<HTMLLIElement>("li[data-task-id]");
			const rowHeight =
				firstTaskRow?.getBoundingClientRect().height ||
				FALLBACK_TASK_ROW_HEIGHT;
			const capacity = Math.max(
				1,
				Math.floor(container.clientHeight / Math.max(rowHeight, 1)),
			);

			onVisibleCapacityChange(capacity);
		};

		calculateVisibleCapacity();

		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(calculateVisibleCapacity);
		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		const firstTaskRow = listRef.current?.querySelector("li[data-task-id]");
		if (firstTaskRow) {
			observer.observe(firstTaskRow);
		}

		return () => observer.disconnect();
	}, [tasks, onVisibleCapacityChange]);

	const handleStart = useCallback(
		async (task: Task) => {
			if (loadingTaskId) return;
			setLoadingTaskId(task.id);
			try {
				await onStartTask(task);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onStartTask],
	);

	const handleDone = useCallback(
		async (task: Task) => {
			if (loadingTaskId) return;
			setLoadingTaskId(task.id);
			try {
				await onDoneTask(task);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onDoneTask],
	);

	const handleReenter = useCallback(
		async (task: Task) => {
			if (loadingTaskId) return;
			setLoadingTaskId(task.id);
			try {
				await onReenterTask(task);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onReenterTask],
	);

	const handleDelete = useCallback(
		async (taskId: string) => {
			if (loadingTaskId) return;
			setLoadingTaskId(taskId);
			try {
				await onDeleteTask(taskId);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onDeleteTask],
	);

	const handleUpdateText = useCallback(
		async (taskId: string, newText: string) => {
			try {
				await updateTask(taskId, { text: newText });
				onRefresh();
			} catch (error) {
				console.error("Failed to update task text:", error);
			}
		},
		[onRefresh],
	);

	const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
		setDraggedTask(task);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", task.id);
	}, []);

	const handleDragOver = useCallback(
		(e: React.DragEvent, targetTask: Task) => {
			e.preventDefault();
			if (draggedTask && draggedTask.id !== targetTask.id) {
				setDropTargetId(targetTask.id);
			}
		},
		[draggedTask],
	);

	const handleDragEnd = useCallback(async () => {
		if (!draggedTask || !dropTargetId) {
			setDraggedTask(null);
			setDropTargetId(null);
			return;
		}

		try {
			await onReorderTasks(draggedTask.id, dropTargetId);
		} catch (error) {
			console.error("Failed to reorder tasks:", error);
		}

		setDraggedTask(null);
		setDropTargetId(null);
	}, [draggedTask, dropTargetId, onReorderTasks]);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent, task: Task) => {
			if (workingTaskId || loadingTaskId) return;
			setDraggedTask(task);
			setTouchStartY(e.touches[0].clientY);
		},
		[workingTaskId, loadingTaskId],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!draggedTask || !touchStartY) return;
			setTouchCurrentY(e.touches[0].clientY);

			// Find the element at the touch position
			const touch = e.touches[0];
			const elementAtPoint = document.elementFromPoint(
				touch.clientX,
				touch.clientY,
			);
			const taskRow = elementAtPoint?.closest("li");
			const taskId = taskRow?.getAttribute("data-task-id");

			if (taskId && taskId !== draggedTask.id) {
				setDropTargetId(taskId);
			}
		},
		[draggedTask, touchStartY],
	);

	const handleTouchEnd = useCallback(async () => {
		if (!draggedTask || !dropTargetId) {
			setDraggedTask(null);
			setDropTargetId(null);
			setTouchStartY(null);
			setTouchCurrentY(null);
			return;
		}

		try {
			await onReorderTasks(draggedTask.id, dropTargetId);
		} catch (error) {
			console.error("Failed to reorder tasks:", error);
		}

		setDraggedTask(null);
		setDropTargetId(null);
		setTouchStartY(null);
		setTouchCurrentY(null);
	}, [draggedTask, dropTargetId, onReorderTasks]);

	const handleSwitchTask = useCallback(
		async (newTask: Task, action: "complete" | "reenter") => {
			if (loadingTaskId) return;
			setLoadingTaskId(newTask.id);
			try {
				await onSwitchTask(newTask, action);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onSwitchTask],
	);

	const handleContainerTouchStart = useCallback((e: React.TouchEvent) => {
		setTouchStartY(e.touches[0].clientY);
	}, []);

	const handleContainerTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (touchStartY === null || !containerRef.current) return;

			const currentY = e.touches[0].clientY;
			const deltaY = touchStartY - currentY;

			containerRef.current.scrollTop += deltaY;
			setTouchStartY(currentY);
		},
		[touchStartY],
	);

	const handleContainerTouchEnd = useCallback(() => {
		setTouchStartY(null);
	}, []);

	if (tasks.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
				<p className="text-muted-foreground font-medium">
					No tasks on this page.
				</p>
				<p className="text-muted-foreground text-sm mt-1">
					Add tasks below to get started.
				</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="flex-1 overflow-y-auto min-h-0"
			onTouchStart={handleContainerTouchStart}
			onTouchMove={handleContainerTouchMove}
			onTouchEnd={handleContainerTouchEnd}
		>
			<ul ref={listRef} className="divide-y divide-border">
				{tasks.map((task) => (
					<TaskRow
						key={task.id}
						task={task}
						isWorking={task.id === workingTaskId}
						workingTask={workingTask}
						onStart={handleStart}
						onDone={handleDone}
						onReenter={handleReenter}
						onDelete={handleDelete}
						onUpdateText={handleUpdateText}
						onSwitchTask={handleSwitchTask}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
						isDragging={draggedTask?.id === task.id}
						isDropTarget={dropTargetId === task.id}
						disabled={!!loadingTaskId}
					/>
				))}
			</ul>
		</div>
	);
}
