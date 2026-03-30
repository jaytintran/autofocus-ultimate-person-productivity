"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
	RotateCcw,
	Trash2,
	Sunrise,
	CloudSun,
	Moon,
	Info,
	Check,
	MessageSquareMore,
	Send,
	Plus,
} from "lucide-react";
import {
	TAG_DEFINITIONS,
	getTagDefinition,
	type TagId as TagIdType,
} from "@/lib/tags";
import { revertTask, updateTask } from "@/lib/store";
import { formatTimeCompact } from "@/lib/utils/time-utils";
import { TagFilter } from "./tag-filter";
import { TagPill } from "./tag-pill";
import type { Pamphlet, Task } from "@/lib/types";
import type { TagId } from "@/lib/tags";
import type { CompletedSortKey } from "./view-tabs";
import type { CompletedViewType } from "./view-tabs";
import type { ContentFilterState } from "@/lib/content-filter";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompletedListProps {
	tasks: Task[];
	selectedTags: Set<TagId | "none">;
	completedSort: CompletedSortKey;
	onRefresh: () => Promise<void>;
	onDeleteTask: (taskId: string) => Promise<void>;
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
	completedViewType: CompletedViewType;
	onRevertTask: (task: Task) => Promise<void>;
	onUpdateTaskTag?: (taskId: string, tag: TagId | null) => Promise<void>;
	onUpdateTaskNote?: (taskId: string, note: string | null) => Promise<void>;
	onUpdateTaskText?: (taskId: string, text: string) => Promise<void>;
	onAddLoggedActivity?: (
		text: string,
		tag?: TagId | null,
		note?: string | null,
		completedAt?: string | null,
	) => Promise<Task>;
	contentFilter?: ContentFilterState;
	pamphlets: Pamphlet[];
}

function parseAtTime(
	text: string,
): { isoString: string; display: string } | null {
	const now = new Date();

	// @now
	if (/@now(?=\s|$)/i.test(text)) {
		const display = now.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return { isoString: now.toISOString(), display };
	}

	// @<N>ago / @<N>m ago / @<N>min ago / @<N>h ago / @<N>hr ago
	// e.g. @30ago, @30mago, @30minago, @1hago, @1hrago, @90ago (treated as minutes)
	const agoMatch = text.match(/@(\d+)\s*(h|hr|m|min|mins|)ago(?=\s|$)/i);
	if (agoMatch) {
		const amount = parseInt(agoMatch[1], 10);
		const unit = agoMatch[2].toLowerCase();
		const ms =
			unit === "h" || unit === "hr"
				? amount * 60 * 60 * 1000
				: amount * 60 * 1000; // default to minutes
		const result = new Date(now.getTime() - ms);
		const display = result.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return { isoString: result.toISOString(), display };
	}

	// @6pm30, @6:30pm, @18:30, @6pm, @6am, @14h30, @6h30
	const match = text.match(
		/@(\d{1,2})(?::(\d{2})|h(\d{2})|(?=am|pm))?(?:\s*)?(am|pm)?(?=\s|$)/i,
	);
	if (!match) return null;

	let hours = parseInt(match[1], 10);
	const minutes = parseInt(match[2] ?? match[3] ?? "0", 10);
	const meridiem = (match[4] ?? "").toLowerCase();
	const rawToken = match[0].toLowerCase();
	const hasPm = rawToken.includes("pm") || meridiem === "pm";
	const hasAm = rawToken.includes("am") || meridiem === "am";

	if (hasPm && hours !== 12) hours += 12;
	if (hasAm && hours === 12) hours = 0;
	if (hours > 23 || minutes > 59) return null;

	const result = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hours,
		minutes,
		0,
		0,
	);
	const display = result.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	return { isoString: result.toISOString(), display };
}

function stripAtTime(text: string): string {
	return text
		.replace(/@now(?=\s|$)/gi, "")
		.replace(/@\d+\s*(?:h|hr|m|min|mins)?ago(?=\s|$)/gi, "")
		.replace(/@\d{1,2}(?::\d{2}|h\d{2})?(?:am|pm)?(?=\s|$)/gi, "")
		.trim();
}

function formatCompletionTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function formatDateGroup(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const taskDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);

	const diffDays = Math.floor(
		(today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	// Format as DD/MM/YY
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear().toString().slice(-2);
	const numericDate = `${day}/${month}/${year}`;

	if (diffDays === 0) return `Today (${numericDate})`;
	if (diffDays === 1) return `Yesterday (${numericDate})`;

	return numericDate;
}

function getDateKey(dateString: string): string {
	const date = new Date(dateString);
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

interface GroupedTasks {
	dateKey: string;
	dateLabel: string;
	tasks: Task[];
	timeBlocks: TimeBlock[];
}

interface TimeBlock {
	period: "morning" | "afternoon" | "evening";
	label: string;
	icon: typeof Sunrise | typeof CloudSun | typeof Moon;
	tasks: Task[];
}

function getTimePeriod(
	dateString: string,
): "morning" | "afternoon" | "evening" {
	const hour = new Date(dateString).getHours();
	if (hour < 12) return "morning";
	if (hour < 18) return "afternoon";
	return "evening";
}

function getTimePeriodLabel(
	period: "morning" | "afternoon" | "evening",
): string {
	switch (period) {
		case "morning":
			return "Morning (00:00 - 11:59)";
		case "afternoon":
			return "Afternoon (12:00 - 17:59)";
		case "evening":
			return "Evening (18:00 - 23:59)";
	}
}

function getTimePeriodIcon(period: "morning" | "afternoon" | "evening") {
	switch (period) {
		case "morning":
			return Sunrise;
		case "afternoon":
			return CloudSun;
		case "evening":
			return Moon;
	}
}

function getTimePeriodColor(
	period: "morning" | "afternoon" | "evening",
): string {
	switch (period) {
		case "morning":
			return "bg-secondary/80 text-secondary-foreground border border-border/40";
		case "afternoon":
			return "bg-af4-olive/20 text-foreground border border-border/30";
		case "evening":
			return "bg-accent/10 text-accent-foreground border border-border/20";
	}
}

function getTimePeriodIconColor(
	period: "morning" | "afternoon" | "evening",
): string {
	switch (period) {
		case "morning":
			return "text-sky-500";
		case "afternoon":
			return "text-amber-500";
		case "evening":
			return "text-indigo-400";
	}
}

export function CompletedList({
	tasks,
	selectedTags,
	completedSort,
	completedViewType,
	hasMore,
	isLoadingMore,
	onLoadMore,
	onRefresh,
	onDeleteTask,
	onRevertTask,
	onUpdateTaskTag,
	onUpdateTaskNote,
	onUpdateTaskText,
	onAddLoggedActivity,
	pamphlets,
}: CompletedListProps) {
	const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null,
	);
	const [showTaskModal, setShowTaskModal] = useState<string | null>(null);
	const [editingNote, setEditingNote] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const [editingTitle, setEditingTitle] = useState("");
	const [editMode, setEditMode] = useState<"none" | "title" | "note">("none");

	const textRefs = useRef<{ [key: string]: HTMLSpanElement }>({});

	// Add loading state for tag updates (similar to TaskList's loadingTaskIds)
	const [loadingTagTaskId, setLoadingTagTaskId] = useState<string | null>(null);

	const [logParsedTime, setLogParsedTime] = useState<{
		isoString: string;
		display: string;
	} | null>(null);

	// Filter tasks by selected tags
	const filteredTasks = useMemo(() => {
		if (selectedTags.size === 0) return tasks;

		return tasks.filter((task) => {
			if (selectedTags.has("none")) {
				return task.tag === null;
			}
			return task.tag && selectedTags.has(task.tag);
		});
	}, [tasks, selectedTags]);

	// Group tasks by completion date
	const groupedTasks = useMemo(() => {
		const groups: Map<string, Task[]> = new Map();

		// Sort tasks by completion time descending
		const sortedTasks = [...filteredTasks].sort((a, b) => {
			switch (completedSort) {
				case "default":
					if (!a.completed_at || !b.completed_at) return 0;
					return (
						new Date(b.completed_at).getTime() -
						new Date(a.completed_at).getTime()
					);
				case "completed_asc":
					if (!a.completed_at || !b.completed_at) return 0;
					return (
						new Date(a.completed_at).getTime() -
						new Date(b.completed_at).getTime()
					);
				case "time_spent_desc":
					return b.total_time_ms - a.total_time_ms;
				case "completed_desc":
				default:
					if (!a.completed_at || !b.completed_at) return 0;
					return (
						new Date(b.completed_at).getTime() -
						new Date(a.completed_at).getTime()
					);
			}
		});

		sortedTasks.forEach((task) => {
			if (!task.completed_at) return;
			const key = getDateKey(task.completed_at);
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)!.push(task);
		});

		// Convert to array and sort by date descending
		const result: GroupedTasks[] = [];
		groups.forEach((groupTasks, dateKey) => {
			if (groupTasks.length > 0 && groupTasks[0].completed_at) {
				// Group tasks by time of day within this date
				const timeBlocksMap = new Map<string, Task[]>();

				groupTasks.forEach((task) => {
					if (!task.completed_at) return;
					const period = getTimePeriod(task.completed_at);
					if (!timeBlocksMap.has(period)) {
						timeBlocksMap.set(period, []);
					}
					timeBlocksMap.get(period)!.push(task);
				});

				// Convert to array and sort by time period (morning -> afternoon -> evening)
				const periodOrder =
					completedSort === "completed_asc"
						? ["morning", "afternoon", "evening"]
						: completedSort === "default"
							? ["morning", "afternoon", "evening"]
							: ["evening", "afternoon", "morning"];

				const timeBlocks: TimeBlock[] = periodOrder
					.filter((period) => timeBlocksMap.has(period))
					.map((period) => ({
						period: period as "morning" | "afternoon" | "evening",
						label: getTimePeriodLabel(
							period as "morning" | "afternoon" | "evening",
						),
						icon: getTimePeriodIcon(
							period as "morning" | "afternoon" | "evening",
						),
						tasks: timeBlocksMap.get(period)!,
					}));

				result.push({
					dateKey,
					dateLabel: formatDateGroup(groupTasks[0].completed_at),
					tasks: groupTasks,
					timeBlocks,
				});
			}
		});

		return result;
	}, [filteredTasks, completedSort]);

	// Build 7-day columns for the column view
	const sevenDayColumns = useMemo(() => {
		const today = new Date();
		const columns = Array.from({ length: 7 }, (_, i) => {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
			const dayName =
				i === 0
					? "Today"
					: i === 1
						? "Yesterday"
						: date.toLocaleDateString("en-GB", { weekday: "short" });
			const dayNum = date.getDate().toString().padStart(2, "0");
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			return {
				key,
				label: dayName,
				date: `${dayNum}/${month}`,
				tasks: filteredTasks.filter(
					(task) => task.completed_at && getDateKey(task.completed_at) === key,
				),
			};
		});
		return columns;
	}, [filteredTasks]);

	const handleRevert = useCallback(
		async (task: Task) => {
			if (loadingTaskId) return;
			setLoadingTaskId(task.id);
			try {
				await onRevertTask(task);
			} finally {
				setLoadingTaskId(null);
			}
		},
		[loadingTaskId, onRevertTask],
	);

	const handleDelete = useCallback(
		async (taskId: string) => {
			if (loadingTaskId) return;

			if (showDeleteConfirm === taskId) {
				setLoadingTaskId(taskId);
				try {
					await onDeleteTask(taskId);
				} finally {
					setLoadingTaskId(null);
					setShowDeleteConfirm(null);
				}
			} else {
				setShowDeleteConfirm(taskId);
				// Auto-hide after 3 seconds
				setTimeout(() => setShowDeleteConfirm(null), 5000);
			}
		},
		[loadingTaskId, showDeleteConfirm, onDeleteTask],
	);

	// Add tag update handler (similar to TaskList's handleUpdateTag)
	const handleUpdateTag = useCallback(
		async (taskId: string, tag: TagId | null) => {
			if (loadingTagTaskId === taskId) return;
			if (!onUpdateTaskTag) return; // Optional prop check

			setLoadingTagTaskId(taskId);
			try {
				await onUpdateTaskTag(taskId, tag);
				await onRefresh();
			} finally {
				setLoadingTagTaskId(null);
			}
		},
		[loadingTagTaskId, onUpdateTaskTag, onRefresh],
	);

	const handleStartEditNote = useCallback(() => {
		const task = tasks.find((t) => t.id === showTaskModal);
		if (task) {
			setEditingNote(task.note || "");
			setEditMode("note");
		}
	}, [tasks, showTaskModal]);

	const handleStartEditTitle = useCallback(() => {
		const task = tasks.find((t) => t.id === showTaskModal);
		if (task) {
			setEditingTitle(task.text);
			setEditMode("title");
		}
	}, [tasks, showTaskModal]);

	const handleCancelEdit = useCallback(() => {
		setEditMode("none");
		setEditingNote("");
		setEditingTitle("");
	}, []);

	const handleSaveNote = useCallback(async () => {
		if (!showTaskModal || !onUpdateTaskNote) return;

		setIsSaving(true);
		try {
			await onUpdateTaskNote(showTaskModal, editingNote.trim() || null);
			await onRefresh();
			setEditMode("none");
			setEditingNote("");
		} finally {
			setIsSaving(false);
		}
	}, [showTaskModal, editingNote, onUpdateTaskNote, onRefresh]);

	const handleSaveTitle = useCallback(async () => {
		if (!showTaskModal || !onUpdateTaskText) return;

		const trimmed = editingTitle.trim();
		if (!trimmed) return; // Don't save empty title

		setIsSaving(true);
		try {
			await onUpdateTaskText(showTaskModal, trimmed);
			await onRefresh();
			setEditMode("none");
			setEditingTitle("");
		} finally {
			setIsSaving(false);
		}
	}, [showTaskModal, editingTitle, onUpdateTaskText, onRefresh]);

	const handleDeleteNote = useCallback(async () => {
		if (!showTaskModal || !onUpdateTaskNote) return;

		setIsSaving(true);
		try {
			await onUpdateTaskNote(showTaskModal, null);
			await onRefresh();
			setEditMode("none");
			setEditingNote("");
		} finally {
			setIsSaving(false);
		}
	}, [showTaskModal, onUpdateTaskNote, onRefresh]);

	// ── Log Activity Bar state ──────────────────────────────────────────────
	const [logText, setLogText] = useState("");
	const [logTag, setLogTag] = useState<TagId | null>(null);
	const [logMentionQuery, setLogMentionQuery] = useState<string | null>(null);
	const [isSubmittingLog, setIsSubmittingLog] = useState(false);
	const logInputRef = useRef<HTMLInputElement>(null);
	const logContainerRef = useRef<HTMLDivElement>(null);

	const handleLogTextChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setLogText(value);

			// Parse @time shortcut
			setLogParsedTime(parseAtTime(value));

			const mentionMatch = value.match(/#(\w*)$/);
			setLogMentionQuery(mentionMatch ? mentionMatch[1] : null);
			for (const tag of TAG_DEFINITIONS) {
				const regex = new RegExp(`#${tag.id}(\\s|$)`, "i");
				if (regex.test(value)) {
					setLogTag(tag.id);
					return;
				}
			}
			setLogTag(null);
		},
		[],
	);

	const handleLogSelectMention = useCallback((tagId: TagId) => {
		setLogText((t) => t.replace(/#\w*$/, "").trim());
		setLogTag(tagId);
		setLogMentionQuery(null);
		logInputRef.current?.focus();
	}, []);

	const handleLogSubmit = useCallback(async () => {
		const trimmed = logText.trim();
		if (!trimmed || !onAddLoggedActivity || isSubmittingLog) return;

		let cleanText = trimmed;
		// Strip inline @time
		cleanText = stripAtTime(cleanText);
		// Strip inline # mention
		for (const tag of TAG_DEFINITIONS) {
			cleanText = cleanText
				.replace(new RegExp(`#${tag.id}(\\s|$)`, "gi"), "")
				.trim();
		}

		setIsSubmittingLog(true);
		try {
			await onAddLoggedActivity(
				cleanText || trimmed,
				logTag,
				null,
				logParsedTime?.isoString ?? null, // <-- pass parsed time here
			);
			setLogText("");
			setLogTag(null);
			setLogParsedTime(null);
			setLogMentionQuery(null);
		} finally {
			setIsSubmittingLog(false);
			logInputRef.current?.focus();
		}
	}, [logText, logTag, logParsedTime, onAddLoggedActivity, isSubmittingLog]);

	const handleLogKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (logMentionQuery !== null) {
					const filtered = TAG_DEFINITIONS.filter((tag) =>
						tag.id.startsWith(logMentionQuery.toLowerCase()),
					);
					if (filtered.length === 1) {
						handleLogSelectMention(filtered[0].id);
						return;
					}
				}
				handleLogSubmit();
			}
			if (e.key === "Escape") {
				setLogMentionQuery(null);
				setLogParsedTime(null);
			}
		},
		[handleLogSubmit, handleLogSelectMention, logMentionQuery],
	);

	const logTagDef = logTag ? getTagDefinition(logTag) : null;

	// ── Bullet Journal sub-components ──────────────────────────────────────

	function BulletRow({ task }: { task: Task }) {
		const isLog = task.source === "log";
		const isLoading = task.id === loadingTaskId;

		// bullet glyph: × for completed tasks, • for logged activities
		const Bullet = () =>
			isLog ? (
				<span className="text-muted-foreground/50 flex-shrink-0 font-mono text-base leading-none mt-0.5">
					•
				</span>
			) : task.note ? (
				<button
					type="button"
					onClick={() => setShowTaskModal(task.id)}
					className="flex-shrink-0 text-amber-500 hover:text-amber-400 transition-colors leading-none mt-0.5"
					title={task.note}
				>
					<Info className="w-3.5 h-3.5" />
				</button>
			) : (
				<span className="text-[#8b9a6b] flex-shrink-0 font-mono text-sm leading-none mt-0.5">
					×
				</span>
			);

		return (
			<li className={`group py-1.5 ${isLoading ? "opacity-50" : ""}`}>
				<div className="flex items-start gap-2.5">
					<Bullet />

					<div className="flex-1 min-w-0">
						{/* Title */}
						<span
							className={`text-sm leading-snug break-words cursor-pointer transition-colors block ${
								isLog
									? "text-foreground hover:text-foreground/80"
									: "text-muted-foreground line-through hover:text-foreground/70"
							}`}
							onClick={() => setShowTaskModal(task.id)}
						>
							{task.text}
						</span>

						{/* Metadata row */}
						<div className="flex items-center gap-2 mt-0.5 flex-wrap">
							{task.completed_at && (
								<span className="text-[11px] text-muted-foreground/60 font-mono">
									{formatCompletionTime(task.completed_at)}
								</span>
							)}
							{task.total_time_ms > 0 && (
								<span className="text-[11px] text-[#8b9a6b]">
									{formatTimeCompact(task.total_time_ms)}
								</span>
							)}
							{task.tag && (
								<TagPill
									tagId={task.tag}
									onSelectTag={(tag) => handleUpdateTag(task.id, tag)}
									disabled={loadingTagTaskId === task.id || isLoading}
									className="scale-90 origin-left"
								/>
							)}
						</div>

						{/* Note inline */}
						{task.note && (
							<p
								className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 cursor-pointer hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
								onClick={() => setShowTaskModal(task.id)}
							>
								🏆 {task.note}
							</p>
						)}
					</div>

					{/* Actions — reveal on hover */}
					<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
						{!isLog && (
							<button
								type="button"
								onClick={() => handleRevert(task)}
								disabled={isLoading}
								className="p-1 hover:bg-accent rounded-sm transition-colors disabled:opacity-50"
								title="Re-enter task"
							>
								<RotateCcw className="w-3 h-3 text-muted-foreground" />
							</button>
						)}
						<button
							type="button"
							onClick={() => handleDelete(task.id)}
							disabled={isLoading}
							className={`p-1 rounded-sm transition-colors disabled:opacity-50 ${
								showDeleteConfirm === task.id
									? "bg-destructive/20"
									: "hover:bg-accent"
							}`}
							title={
								showDeleteConfirm === task.id
									? "Click again to confirm"
									: "Delete"
							}
						>
							<Trash2
								className={`w-3 h-3 ${
									showDeleteConfirm === task.id
										? "text-destructive"
										: "text-muted-foreground"
								}`}
							/>
						</button>
					</div>
				</div>
			</li>
		);
	}

	function BulletJournalView() {
		return (
			<div
				className="flex-1 overflow-y-auto px-5 py-2 !scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent custom-scrollbar"
				style={{
					scrollbarWidth: "thin",
					scrollbarColor: "hsl(var(--border)) transparent",
				}}
			>
				{groupedTasks.length === 0 && (
					<div className="flex flex-col items-center justify-center text-center py-16">
						<p className="text-muted-foreground font-medium">No entries yet.</p>
						<p className="text-muted-foreground text-sm mt-1">
							Complete tasks or log an activity below.
						</p>
					</div>
				)}

				{groupedTasks.map((group) => (
					<div key={group.dateKey} className="mb-6">
						{/* Date header — BuJo style */}
						<div className="flex items-center gap-3 mb-2">
							<span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
								{group.dateLabel}
							</span>
							<div className="flex-1 h-px bg-border/50" />
						</div>

						{/* Time blocks */}
						{group.timeBlocks.map((timeBlock) => {
							const Icon = timeBlock.icon;
							return (
								<div key={timeBlock.period} className="mb-3">
									{/* Period label */}
									<div className="flex items-center gap-1.5 mb-1">
										<Icon
											className={`w-3 h-3 ${getTimePeriodIconColor(timeBlock.period)}`}
										/>
										<span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
											{timeBlock.period}
										</span>
									</div>

									<ul className="space-y-0">
										{timeBlock.tasks.map((task) => (
											<BulletRow key={task.id} task={task} />
										))}
									</ul>
								</div>
							);
						})}
					</div>
				))}

				{/* Load more */}
				{hasMore && (
					<div className="flex justify-center py-4">
						<button
							type="button"
							onClick={onLoadMore}
							disabled={isLoadingMore}
							className="px-4 py-2 text-sm border border-border rounded-full hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground"
						>
							{isLoadingMore ? "Loading..." : "Load more"}
						</button>
					</div>
				)}
			</div>
		);
	}

	// ── Tag mention dropdown (reused for log bar) ───────────────────────────
	function LogTagMentionDropdown({
		query,
		onSelect,
	}: {
		query: string;
		onSelect: (tagId: TagId) => void;
	}) {
		const filtered = TAG_DEFINITIONS.filter((tag) =>
			tag.id.startsWith(query.toLowerCase()),
		);
		if (filtered.length === 0) return null;
		return (
			<div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50 min-w-[160px]">
				<p className="text-[10px] text-muted-foreground px-2 py-1">Tag as...</p>
				{filtered.map((tag) => (
					<button
						key={tag.id}
						type="button"
						onMouseDown={(e) => {
							e.preventDefault();
							onSelect(tag.id);
						}}
						className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg hover:bg-accent transition-colors text-left"
					>
						<span>{tag.emoji}</span>
						<span>{tag.label}</span>
					</button>
				))}
			</div>
		);
	}

	// ── Empty state ─────────────────────────────────────────────────────────
	if (tasks.length === 0 && completedViewType !== "bullet") {
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
				<p className="text-muted-foreground font-medium">
					No completed tasks yet.
				</p>
				<p className="text-muted-foreground text-sm mt-1">
					Complete tasks from the Tasks view.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-h-0">
			<div className="flex-1 overflow-y-auto">
				{completedViewType === "bullet" ? (
					<BulletJournalView />
				) : completedViewType === "7days" ? (
					// 7-day column view
					<div className="h-full overflow-x-auto overflow-y-hidden">
						<div className="h-full overflow-x-auto custom-scrollbar">
							<div className="flex md:grid md:grid-cols-7 divide-x divide-border h-full">
								{sevenDayColumns.map((col) => (
									<div
										key={col.key}
										className="flex flex-col min-w-[180px] sm:min-w-[220px] md:min-w-0 w-full"
									>
										<div className="px-2 py-2 border-b border-border bg-secondary/50 sticky top-0 z-10 text-center">
											<p className="text-xs font-medium text-foreground">
												{col.label}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{col.date}
											</p>
										</div>
										<div
											className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 space-y-1 custom-scrollbar"
											style={{
												WebkitOverflowScrolling: "touch",
												touchAction: "pan-y",
											}}
										>
											<div className="flex-1 overflow-y-auto p-1.5 space-y-1">
												{col.tasks.length === 0 ? (
													<p className="text-[10px] text-muted-foreground text-center mt-4 px-1 opacity-50">
														—
													</p>
												) : (
													col.tasks.map((task) => {
														const isLoading = task.id === loadingTaskId;
														return (
															<div
																key={task.id}
																className={`group rounded-lg px-2 py-1.5 text-[11px] bg-secondary/50 hover:bg-secondary transition-colors space-y-1 ${isLoading ? "opacity-50" : ""}`}
															>
																<div className="flex items-start gap-1.5">
																	{task.note && (
																		<button
																			type="button"
																			onClick={() => setShowTaskModal(task.id)}
																			className="bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 transition-colors"
																		>
																			<Info className="w-3 h-3" />
																		</button>
																	)}
																	<div className="flex-1 min-w-0">
																		<p
																			className="text-foreground line-through opacity-60 leading-snug break-words cursor-pointer"
																			onClick={() => setShowTaskModal(task.id)}
																		>
																			{task.text}
																		</p>
																	</div>
																</div>
																<div className="flex items-center gap-1 flex-wrap">
																	{task.completed_at && (
																		<span className="text-muted-foreground opacity-60">
																			{formatCompletionTime(task.completed_at)}
																		</span>
																	)}
																	{task.total_time_ms > 0 && (
																		<span className="text-[#8b9a6b]">
																			{formatTimeCompact(task.total_time_ms)}
																		</span>
																	)}
																	<TagPill
																		tagId={task.tag}
																		onSelectTag={(tag) =>
																			handleUpdateTag(task.id, tag)
																		}
																		disabled={
																			loadingTagTaskId === task.id || isLoading
																		}
																		className="scale-90 origin-left"
																	/>
																</div>
																<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																	<button
																		type="button"
																		onClick={() => handleRevert(task)}
																		disabled={isLoading}
																		className="p-0.5 hover:bg-accent rounded transition-colors"
																	>
																		<RotateCcw className="w-3 h-3 text-muted-foreground" />
																	</button>
																	<button
																		type="button"
																		onClick={() => handleDelete(task.id)}
																		disabled={isLoading}
																		className={`p-0.5 rounded transition-colors ${showDeleteConfirm === task.id ? "bg-destructive/20" : "hover:bg-accent"}`}
																	>
																		<Trash2
																			className={`w-3 h-3 ${showDeleteConfirm === task.id ? "text-destructive" : "text-muted-foreground"}`}
																		/>
																	</button>
																</div>
															</div>
														);
													})
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				) : (
					<>
						{groupedTasks.map((group) => (
							<div key={group.dateKey} className="mb-4">
								<div className="px-4 py-2 bg-secondary/50 border-b border-border sticky top-0 z-10">
									<span className="text-sm text-muted-foreground font-medium">
										{group.dateLabel}
									</span>
								</div>
								{group.timeBlocks.map((timeBlock) => {
									const Icon = timeBlock.icon;
									return (
										<div
											key={timeBlock.period}
											className={`flex gap-3 ${getTimePeriodColor(timeBlock.period)} py-2 px-3`}
										>
											<div className="flex items-center">
												<Icon
													className={`w-4 h-4 ${getTimePeriodIconColor(timeBlock.period)}`}
												/>
											</div>
											<div className="flex-1 min-w-0">
												<ul className="divide-y divide-border/50">
													{timeBlock.tasks.map((task) => {
														const isLoading = task.id === loadingTaskId;
														return (
															<li
																key={task.id}
																className={`group py-2.5 flex items-center gap-3 ${isLoading ? "opacity-50" : ""}`}
															>
																{task.note ? (
																	<button
																		type="button"
																		onClick={() => setShowTaskModal(task.id)}
																		className="flex items-center rounded-full bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 transition-colors group/trophy"
																		title={task.note}
																	>
																		<Info className="w-4 h-4" />
																	</button>
																) : (
																	<span className="text-[#8b9a6b] flex-shrink-0">
																		<Check className="w-4 h-4" />
																	</span>
																)}
																<div className="flex-1 min-w-0">
																	<span
																		className="truncate text-muted-foreground line-through cursor-pointer hover:text-foreground/70 transition-colors block"
																		onClick={() => setShowTaskModal(task.id)}
																		title="Click to view full text"
																	>
																		{task.text}
																	</span>
																</div>
																<TagPill
																	tagId={task.tag}
																	onSelectTag={(tag) =>
																		handleUpdateTag(task.id, tag)
																	}
																	disabled={
																		loadingTagTaskId === task.id || isLoading
																	}
																	className="scale-90 origin-left"
																/>
																{task.total_time_ms > 0 && (
																	<span className="text-xs text-[#8b9a6b] flex-shrink-0">
																		{formatTimeCompact(task.total_time_ms)}
																	</span>
																)}
																{task.completed_at && (
																	<span className="text-xs text-muted-foreground flex-shrink-0">
																		{formatCompletionTime(task.completed_at)}
																	</span>
																)}
																<div className="flex items-center gap-1 flex-shrink-0">
																	<button
																		type="button"
																		onClick={() => handleRevert(task)}
																		disabled={isLoading}
																		className="p-1.5 hover:bg-accent rounded-sm transition-colors disabled:opacity-50"
																		title="Re-enter task"
																	>
																		<RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
																	</button>
																	<button
																		type="button"
																		onClick={() => handleDelete(task.id)}
																		disabled={isLoading}
																		className={`p-1.5 rounded-sm transition-colors disabled:opacity-50 ${
																			showDeleteConfirm === task.id
																				? "bg-destructive/20 hover:bg-destructive/30"
																				: "hover:bg-accent"
																		}`}
																		title={
																			showDeleteConfirm === task.id
																				? "Click again to confirm"
																				: "Delete task"
																		}
																	>
																		<Trash2
																			className={`w-3.5 h-3.5 ${
																				showDeleteConfirm === task.id
																					? "text-destructive"
																					: "text-muted-foreground"
																			}`}
																		/>
																	</button>
																</div>
															</li>
														);
													})}
												</ul>
											</div>
										</div>
									);
								})}
							</div>
						))}
						{hasMore && (
							<div className="flex justify-center py-6">
								<button
									type="button"
									onClick={onLoadMore}
									disabled={isLoadingMore}
									className="px-4 py-2 text-sm border border-border rounded-full hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground"
								>
									{isLoadingMore ? "Loading..." : "Load more"}
								</button>
							</div>
						)}
						{!hasMore && tasks.length > 0 && (
							<div className="flex justify-center py-6">
								<p className="text-xs text-muted-foreground">
									All completed tasks loaded 🎉
								</p>
							</div>
						)}
					</>
				)}
			</div>

			{/* Task detail modal */}
			{showTaskModal && (
				<Dialog
					open={!!showTaskModal}
					onOpenChange={() => {
						setShowTaskModal(null);
						setEditMode("none");
						setEditingNote("");
						setEditingTitle("");
					}}
				>
					<DialogContent className="sm:max-w-[500px] max-w-[calc(100vw-2rem)] overflow-hidden p-0">
						<div className="px-6 pt-6 pb-1">
							<DialogHeader>
								<DialogTitle>Completed Task</DialogTitle>
							</DialogHeader>
							<div className="mt-3">
								{editMode === "title" ? (
									<div className="space-y-3">
										<input
											type="text"
											value={editingTitle}
											onChange={(e) => setEditingTitle(e.target.value)}
											className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
											disabled={isSaving}
											autoFocus
										/>
										<div className="flex gap-2 justify-end">
											<Button
												variant="outline"
												size="sm"
												onClick={handleCancelEdit}
												disabled={isSaving}
											>
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={handleSaveTitle}
												disabled={isSaving || !editingTitle.trim()}
											>
												{isSaving ? "Saving..." : "Save"}
											</Button>
										</div>
									</div>
								) : (
									<div className="group flex items-start gap-2">
										<p
											className="text-sm text-muted-foreground line-through break-words overflow-wrap-anywhere flex-1 cursor-pointer hover:text-foreground/70 transition-colors"
											onClick={handleStartEditTitle}
											title="Click to edit"
										>
											{tasks.find((t) => t.id === showTaskModal)?.text}
										</p>
										<button
											onClick={handleStartEditTitle}
											className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
											title="Edit title"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className="text-muted-foreground"
											>
												<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
											</svg>
										</button>
									</div>
								)}
							</div>
						</div>
						<div className="border-t border-border px-6 py-4">
							{editMode === "note" ? (
								<div className="space-y-3">
									<div className="flex items-start gap-3">
										<span className="text-base leading-none mt-2 flex-shrink-0">
											🏆
										</span>
										<textarea
											value={editingNote}
											onChange={(e) => setEditingNote(e.target.value)}
											placeholder="Add a note about this achievement..."
											className="flex-1 min-h-[80px] bg-background border border-input rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
											disabled={isSaving}
										/>
									</div>
									<div className="flex gap-2 justify-end">
										<Button
											variant="outline"
											size="sm"
											onClick={handleCancelEdit}
											disabled={isSaving}
										>
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleSaveNote}
											disabled={isSaving}
										>
											{isSaving ? "Saving..." : "Save"}
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									{tasks.find((t) => t.id === showTaskModal)?.note ? (
										<div className="group flex items-start gap-3 bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300/50 dark:border-amber-700/40 rounded-lg px-4 py-3">
											<span className="text-base leading-none mt-0.5 flex-shrink-0">
												🏆
											</span>
											<p
												className="text-sm text-amber-800 dark:text-amber-300 break-words flex-1 cursor-pointer"
												onClick={handleStartEditNote}
												title="Click to edit"
											>
												{tasks.find((t) => t.id === showTaskModal)?.note}
											</p>
											<button
												onClick={handleStartEditNote}
												className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded flex-shrink-0"
												title="Edit note"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													className="text-amber-700 dark:text-amber-400"
												>
													<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
												</svg>
											</button>
										</div>
									) : (
										<p className="text-sm text-muted-foreground italic">
											No note added.
										</p>
									)}
									<div className="flex gap-2 justify-end">
										{tasks.find((t) => t.id === showTaskModal)?.note && (
											<Button
												variant="outline"
												size="sm"
												onClick={handleDeleteNote}
												disabled={isSaving || !onUpdateTaskNote}
												className="text-destructive hover:text-destructive hover:bg-destructive/10"
											>
												Delete Note
											</Button>
										)}
										<Button
											size="sm"
											onClick={handleStartEditNote}
											disabled={!onUpdateTaskNote}
										>
											{tasks.find((t) => t.id === showTaskModal)?.note
												? "Edit Note"
												: "Add Note"}
										</Button>
									</div>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Log Activity Bar — only shown in bullet view */}
			{completedViewType === "bullet" && onAddLoggedActivity && (
				<div
					ref={logContainerRef}
					className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-10"
				>
					<div className="bg-card border border-border rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 relative">
						{logMentionQuery !== null && (
							<div className="absolute bottom-full left-4 mb-2">
								<LogTagMentionDropdown
									query={logMentionQuery}
									onSelect={handleLogSelectMention}
								/>
							</div>
						)}

						{/* Dot bullet indicator */}
						<span className="text-muted-foreground/50 font-mono text-base flex-shrink-0 select-none">
							•
						</span>

						{/* Active tag pill */}
						{logTagDef && (
							<button
								type="button"
								onClick={() => setLogTag(null)}
								className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[#8b9a6b]/10 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors group"
								title="Remove tag"
							>
								<span>{logTagDef.emoji}</span>
								<span>{logTagDef.label}</span>
								<span className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
									×
								</span>
							</button>
						)}

						{/* Active time pill */}
						{logParsedTime && (
							<button
								type="button"
								onClick={() => {
									setLogParsedTime(null);
									setLogText((t) => stripAtTime(t));
								}}
								className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors group"
								title="Remove time"
							>
								<span>🕐</span>
								<span>{logParsedTime.display}</span>
								<span className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
									×
								</span>
							</button>
						)}

						<input
							ref={logInputRef}
							type="text"
							value={logText}
							onChange={handleLogTextChange}
							onKeyDown={handleLogKeyDown}
							placeholder="Log an activity. Use # to tag, @time to set time..."
							className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
							disabled={isSubmittingLog}
						/>

						<button
							onClick={handleLogSubmit}
							disabled={!logText.trim() || isSubmittingLog}
							type="button"
							className="p-1.5 hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
						>
							<Send className="w-4 h-4 text-[#8b9a6b]" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
