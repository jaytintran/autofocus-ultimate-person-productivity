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
	Send,
	Delete,
	Trash,
	RefreshCcw,
	CopyCheck,
	Copy,
} from "lucide-react";
import {
	TAG_DEFINITIONS,
	getTagDefinition,
	type TagId as TagIdType,
} from "@/lib/tags";
import { formatTimeCompact } from "@/lib/utils/time-utils";
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
	activePamphletId?: string | null;
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

interface EntryModalProps {
	task: Task;
	onSave: (
		id: string,
		title: string,
		note: string,
		tag: TagId | null,
	) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onRevert?: (id: string) => Promise<void>;
	onClose: () => void;
}

function EntryModal({
	task,
	onSave,
	onDelete,
	onRevert,
	onClose,
}: EntryModalProps) {
	const isLog = task.source === "log";
	const [title, setTitle] = useState(task.text);
	const [note, setNote] = useState(task.note ?? "");
	const [tag, setTag] = useState<TagId | null>(task.tag ?? null);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = useCallback(async () => {
		if (isSaving || !title.trim()) return;
		setIsSaving(true);
		try {
			await onSave(task.id, title.trim(), note.trim(), tag);
			onClose();
		} finally {
			setIsSaving(false);
		}
	}, [task.id, title, note, tag, isSaving, onSave, onClose]);

	const handleDelete = useCallback(async () => {
		onClose();
		await onDelete(task.id);
	}, [task.id, onDelete, onClose]);

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[460px] max-w-[calc(100vw-2rem)] overflow-hidden p-0">
				{/* Header */}
				<div className="px-6 pt-5 pb-4">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{isLog ? (
								<span className="text-muted-foreground/50 font-mono text-base leading-none">
									•
								</span>
							) : (
								<span className="text-[#8b9a6b] font-mono text-sm leading-none">
									×
								</span>
							)}
							<span>{isLog ? "Log Entry" : "Completed Task"}</span>
						</DialogTitle>
					</DialogHeader>

					{/* Meta row */}
					<div className="flex items-center gap-2 mt-3 flex-wrap">
						{task.completed_at && (
							<span className="text-[11px] font-mono text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-md">
								{formatCompletionTime(task.completed_at)}
							</span>
						)}
						{!isLog && task.total_time_ms > 0 && (
							<span className="text-[11px] text-[#8b9a6b] bg-[#8b9a6b]/10 px-2 py-0.5 rounded-md">
								{formatTimeCompact(task.total_time_ms)}
							</span>
						)}
						<TagPill tagId={tag} onSelectTag={setTag} disabled={isSaving} />
					</div>
				</div>

				{/* Body */}
				<div className="px-6 pb-6 space-y-4 border-t border-border/60 pt-4 bg-secondary/20">
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							{isLog ? "Activity" : "Task"}
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSave();
							}}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
							disabled={isSaving}
							autoFocus
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							{isLog ? "Note" : "Achievement Note"}
						</label>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={isLog ? "Add a note..." : "What did you accomplish?"}
							rows={3}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none transition-colors"
							disabled={isSaving}
						/>
					</div>

					<div className="flex items-center justify-between pt-1">
						<div className="flex gap-2">
							<Button
								variant="ghost"
								onClick={handleDelete}
								disabled={isSaving}
								className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-50"
							>
								<Trash className="w-3.5! h-3.5!" />
							</Button>
							{!isLog && onRevert && (
								<Button
									variant="ghost"
									onClick={async () => {
										onClose();
										await onRevert(task.id);
									}}
									disabled={isSaving}
									className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-50"
								>
									<RefreshCcw className="w-3.5! h-3.5!" />
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onClose}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSave}
								disabled={isSaving || !title.trim()}
							>
								{isSaving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function generateDayMarkdown(
	group: GroupedTasks,
	pamphlets: Pamphlet[],
	activePamphletId?: string | null,
): string {
	const pamphlet = pamphlets.find((p) => p.id === activePamphletId);
	const pamphletLine = pamphlet ? `**${pamphlet.name}**\n` : "";

	const periodEmoji = {
		morning: "🌅",
		afternoon: "☀️",
		evening: "🌙",
	};

	const lines: string[] = [`# ${group.dateLabel}`, pamphletLine].filter(
		Boolean,
	);

	for (const block of group.timeBlocks) {
		lines.push(
			`\n## ${periodEmoji[block.period]} ${block.period.charAt(0).toUpperCase() + block.period.slice(1)}`,
		);

		for (const task of block.tasks) {
			const isLog = (task.source ?? "task") === "log";
			const bullet = isLog ? "-" : "[x]";
			const time = task.completed_at
				? formatCompletionTime(task.completed_at)
				: "";
			const duration =
				task.total_time_ms > 0 ? formatTimeCompact(task.total_time_ms) : "";
			const tag = task.tag ? `#${task.tag}` : "";
			const note = task.note ? ` — _${task.note}_` : "";

			const meta = [time, duration, tag].filter(Boolean).join("  ");
			lines.push(`${bullet} ${task.text}${note}${meta ? `  \`${meta}\`` : ""}`);
		}
	}

	return lines.join("\n");
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
	activePamphletId,
}: CompletedListProps) {
	const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null,
	);
	const [showTaskModal, setShowTaskModal] = useState<string | null>(null);

	// Add loading state for tag updates (similar to TaskList's loadingTaskIds)
	const [loadingTagTaskId, setLoadingTagTaskId] = useState<string | null>(null);

	const [copiedDateKey, setCopiedDateKey] = useState<string | null>(null);

	const handleExportDay = useCallback(
		async (group: GroupedTasks) => {
			const md = generateDayMarkdown(group, pamphlets, activePamphletId);
			await navigator.clipboard.writeText(md);
			setCopiedDateKey(group.dateKey);
			setTimeout(() => setCopiedDateKey(null), 2000);
		},
		[pamphlets],
	);

	const [logParsedTime, setLogParsedTime] = useState<{
		isoString: string;
		display: string;
	} | null>(null);

	// Filter tasks by selected tags
	const filteredTasks = useMemo(() => {
		if (selectedTags.size === 0) return tasks;
		return tasks.filter((task) => {
			if (selectedTags.has("none") && task.tag === null) return true;
			return task.tag !== null && selectedTags.has(task.tag);
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

	const modalTask = tasks.find((t) => t.id === showTaskModal) ?? null;
	const isModalLog = modalTask?.source === "log";

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

						{/* Note inline */}
						{task.note && (
							<p
								onClick={() => setShowTaskModal(task.id)}
								className={`text-[12px] mt-0.5 cursor-pointer transition-colors ${
									isLog
										? "text-muted-foreground/60 hover:text-muted-foreground"
										: "text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
								}`}
							>
								{isLog ? task.note : `🏆 ${task.note}`}
							</p>
						)}
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
							<button
								type="button"
								onClick={() => handleExportDay(group)}
								className="flex items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
								title="Copy day as markdown"
							>
								{copiedDateKey === group.dateKey ? (
									<CopyCheck className="w-4 h-4 text-[#8b9a6b]" />
								) : (
									<Copy className="w-4 h-4" />
								)}
							</button>
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
																className={`flex items-center gap-3 py-2 cursor-pointer ${isLoading ? "opacity-50" : ""}`}
																onClick={() => setShowTaskModal(task.id)}
															>
																{task.source === "log" ? (
																	<span className="text-muted-foreground/50 font-mono text-base leading-none flex-shrink-0">
																		•
																	</span>
																) : task.note ? (
																	<Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
																) : (
																	<Check className="w-3.5 h-3.5 text-[#8b9a6b] flex-shrink-0" />
																)}
																<span
																	className={`flex-1 min-w-0 truncate text-sm ${
																		task.source === "log"
																			? "text-foreground"
																			: "text-muted-foreground line-through"
																	}`}
																>
																	{task.text}
																</span>
																{task.tag && (
																	<TagPill
																		tagId={task.tag}
																		onSelectTag={(tag) =>
																			handleUpdateTag(task.id, tag)
																		}
																		disabled={
																			loadingTagTaskId === task.id || isLoading
																		}
																		className="scale-90 origin-right flex-shrink-0"
																	/>
																)}
																{task.total_time_ms > 0 && (
																	<span className="text-xs text-[#8b9a6b] flex-shrink-0">
																		{formatTimeCompact(task.total_time_ms)}
																	</span>
																)}
																{task.completed_at && (
																	<span className="text-xs text-muted-foreground/60 flex-shrink-0 font-mono">
																		{formatCompletionTime(task.completed_at)}
																	</span>
																)}
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
			{showTaskModal && modalTask && (
				<EntryModal
					task={modalTask}
					onClose={() => setShowTaskModal(null)}
					onSave={async (id, title, note, tag) => {
						await Promise.all([
							onUpdateTaskText
								? onUpdateTaskText(id, title)
								: Promise.resolve(),
							onUpdateTaskNote
								? onUpdateTaskNote(id, note || null)
								: Promise.resolve(),
							onUpdateTaskTag ? onUpdateTaskTag(id, tag) : Promise.resolve(),
						]);
						await onRefresh();
					}}
					onDelete={onDeleteTask}
					onRevert={async (id) => {
						const task = tasks.find((t) => t.id === id);
						if (task) await onRevertTask(task);
					}}
				/>
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
