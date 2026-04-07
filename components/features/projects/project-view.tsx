"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useProjects } from "@/hooks/data/use-projects";
import type { Project, ProjectStatus } from "@/lib/db/projects";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Brain,
	Code2,
	DollarSign,
	Heart,
	Globe,
	Lightbulb,
	BarChart2,
	Pen,
	Microscope,
	Dumbbell,
	Music,
	Cpu,
	FolderOpen,
	Search,
	Plus,
	X,
	Flame,
	CheckCircle2,
	Circle,
	LayoutDashboard,
	Layers,
	Edit,
	Trash2,
	Menu,
	ChevronRight,
	Target,
	Clock,
	Pause,
	Archive,
	CalendarDays,
	TrendingUp,
	Briefcase,
	Rocket,
	Zap,
	ShoppingBag,
	Users,
	LucideIcon,
} from "lucide-react";

// ─── Category Icons ───────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
	"software & ai engineering",
	"agency & freelance",
	"day trading",
	"solopreneur & saas",
	"ace of all trades",
	"combatbuilding & superhuman",
	"supermale & alpha",
	"polyglot vagabond",
	"personal brand",
	"e-commerce",
	"business & investment",
	"society & influence",
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
	"software & ai engineering": Cpu,
	"agency & freelance": Briefcase,
	"day trading": BarChart2,
	"solopreneur & saas": Rocket,
	"ace of all trades": Zap,
	"combatbuilding & superhuman": Dumbbell,
	"supermale & alpha": Flame,
	"polyglot vagabond": Globe,
	"personal brand": Pen,
	"e-commerce": ShoppingBag,
	"business & investment": DollarSign,
	"society & influence": Users,
};

function getCategoryIcon(category: string): LucideIcon {
	const lower = category.toLowerCase();
	return CATEGORY_ICONS[lower] ?? FolderOpen;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: {
	[K in ProjectStatus]: {
		label: string;
		dot: string;
		text: string;
		bg: string;
	};
} = {
	planning: {
		label: "Planning",
		dot: "bg-amber-400",
		text: "text-amber-500",
		bg: "bg-amber-500/10",
	},
	active: {
		label: "Active",
		dot: "bg-sky-500",
		text: "text-sky-500",
		bg: "bg-sky-500/10",
	},
	paused: {
		label: "Paused",
		dot: "bg-muted-foreground/40",
		text: "text-muted-foreground",
		bg: "bg-muted/50",
	},
	completed: {
		label: "Completed",
		dot: "bg-[#8b9a6b]",
		text: "text-[#8b9a6b]",
		bg: "bg-[#8b9a6b]/10",
	},
	archived: {
		label: "Archived",
		dot: "bg-muted-foreground/20",
		text: "text-muted-foreground/40",
		bg: "bg-muted/30",
	},
};

const PRIORITY_CONFIG: {
	[key: string]: { label: string; color: string; bg: string; order: number };
} = {
	CRITICAL: {
		label: "CRITICAL",
		color: "text-red-500",
		bg: "bg-red-500/10",
		order: 0,
	},
	HIGH: {
		label: "HIGH",
		color: "text-orange-500",
		bg: "bg-orange-500/10",
		order: 1,
	},
	MEDIUM: {
		label: "MEDIUM",
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		order: 2,
	},
	LOW: {
		label: "LOW",
		color: "text-muted-foreground",
		bg: "bg-muted",
		order: 3,
	},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByPriority(a: Project, b: Project): number {
	const pa = PRIORITY_CONFIG[a.priority ?? "LOW"]?.order ?? 99;
	const pb = PRIORITY_CONFIG[b.priority ?? "LOW"]?.order ?? 99;
	return pa - pb || a.title.localeCompare(b.title);
}

function formatDueDate(dateStr: string | null): string | null {
	if (!dateStr) return null;
	const d = new Date(dateStr);
	const now = new Date();
	const diff = d.getTime() - now.getTime();
	const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
	if (days < 0) return `${Math.abs(days)}d overdue`;
	if (days === 0) return "Due today";
	if (days === 1) return "Due tomorrow";
	if (days <= 7) return `${days}d left`;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
	project,
	onClick,
}: {
	project: Project;
	onClick: () => void;
}) {
	const status = STATUS_CONFIG[project.status];
	const priority = project.priority ? PRIORITY_CONFIG[project.priority] : null;
	const dueLabel = formatDueDate(project.due_date);
	const isOverdue =
		project.due_date &&
		new Date(project.due_date) < new Date() &&
		project.status !== "completed";

	return (
		<div
			onClick={onClick}
			className="group relative bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-border/80 hover:bg-accent/30 transition-all duration-150 flex flex-col gap-3"
		>
			{/* Status + Priority */}
			<div className="flex items-center justify-between gap-2">
				<div
					className={`flex items-center gap-1.5 text-[10px] font-medium ${status.text}`}
				>
					<div
						className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`}
					/>
					{status.label}
				</div>
				{priority && (
					<span
						className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priority.color} ${priority.bg}`}
					>
						{priority.label}
					</span>
				)}
			</div>

			{/* Title + Description */}
			<div className="flex-1 min-w-0">
				<p
					className={`text-sm font-medium leading-snug line-clamp-2 ${project.status === "completed" || project.status === "archived" ? "text-muted-foreground" : "text-foreground"}`}
				>
					{project.title}
				</p>
				{project.description && (
					<p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2">
						{project.description}
					</p>
				)}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between gap-2">
				{dueLabel && (
					<span
						className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-muted-foreground/50"}`}
					>
						<CalendarDays className="w-2.5 h-2.5" />
						{dueLabel}
					</span>
				)}
				{!dueLabel && (
					<span className="text-[10px] text-muted-foreground/30">
						{project.category}
					</span>
				)}

				{/* Progress bar */}
				{project.progress !== null && project.progress !== undefined && (
					<div className="flex items-center gap-1.5 flex-shrink-0">
						<div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
							<div
								className="h-full bg-[#8b9a6b] rounded-full transition-all"
								style={{ width: `${project.progress}%` }}
							/>
						</div>
						<span className="text-[10px] text-[#8b9a6b]">
							{project.progress}%
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────

function ProjectModal({
	project,
	onClose,
	onUpdate,
	onDelete,
	onStatusChange,
}: {
	project: Project;
	onClose: () => void;
	onUpdate: (id: string, updates: Partial<Project>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onStatusChange: (id: string, status: ProjectStatus) => Promise<void>;
}) {
	const [notes, setNotes] = useState(project.notes ?? "");
	const [outcomes, setOutcomes] = useState(project.key_outcomes ?? "");
	const [description, setDescription] = useState(project.description ?? "");
	const [progress, setProgress] = useState(project.progress?.toString() ?? "");
	const [dueDate, setDueDate] = useState(
		project.due_date
			? new Date(project.due_date).toISOString().split("T")[0]
			: "",
	);
	const [isSaving, setIsSaving] = useState(false);
	const [localStatus, setLocalStatus] = useState<ProjectStatus>(project.status);

	const priority = project.priority ? PRIORITY_CONFIG[project.priority] : null;

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onUpdate(project.id, {
				title: title.trim() || project.title,
				description: description.trim() || null,
				notes: notes.trim() || null,
				key_outcomes: outcomes.trim() || null,
				progress: progress
					? Math.min(100, Math.max(0, parseInt(progress)))
					: null,
				due_date: dueDate ? new Date(dueDate).toISOString() : null,
			});
			if (localStatus !== project.status) {
				await onStatusChange(project.id, localStatus);
			}
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	const [title, setTitle] = useState(project.title);

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[580px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden max-h-[90vh] flex flex-col">
				<div className="px-6 pt-5 pb-4 flex-shrink-0">
					<DialogHeader>
						<DialogTitle>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="text-base font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-ring focus:outline-none transition-colors w-full pr-6"
							/>
						</DialogTitle>
					</DialogHeader>

					{/* Meta pills */}
					<div className="flex items-center gap-2 mt-3 flex-wrap">
						{priority && (
							<span
								className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priority.color} ${priority.bg}`}
							>
								{priority.label}
							</span>
						)}
						<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
							{project.category}
						</span>
					</div>

					{/* Status selector */}
					<div className="flex items-center gap-1.5 mt-3 flex-wrap">
						{(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => {
							const cfg = STATUS_CONFIG[s];
							return (
								<button
									key={s}
									type="button"
									onClick={() => setLocalStatus(s)}
									className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
										localStatus === s
											? `border-foreground/30 bg-foreground/10 ${cfg.text}`
											: "border-border text-muted-foreground hover:border-foreground/20"
									}`}
								>
									{cfg.label}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 border-t border-border/60 pt-4 bg-secondary/20">
					{/* Description */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What is this project about..."
							rows={2}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
						/>
					</div>

					{/* Progress + Due Date */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Progress (%)
							</label>
							<input
								type="number"
								min="0"
								max="100"
								value={progress}
								onChange={(e) => setProgress(e.target.value)}
								placeholder="0–100"
								className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
							{progress && (
								<div className="h-1.5 bg-secondary rounded-full overflow-hidden">
									<div
										className="h-full bg-[#8b9a6b] rounded-full transition-all"
										style={{
											width: `${Math.min(100, parseInt(progress) || 0)}%`,
										}}
									/>
								</div>
							)}
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Due Date
							</label>
							<input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Raw thoughts, blockers, context..."
							rows={4}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
						/>
					</div>

					{/* Key Outcomes */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Key Outcomes
						</label>
						<textarea
							value={outcomes}
							onChange={(e) => setOutcomes(e.target.value)}
							placeholder="What does done look like, one per line..."
							rows={4}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
						/>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-between pt-1">
						<button
							type="button"
							onClick={async () => {
								onClose();
								await onDelete(project.id);
							}}
							className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
						>
							Delete project
						</button>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={onClose}>
								Cancel
							</Button>
							<Button size="sm" onClick={handleSave} disabled={isSaving}>
								{isSaving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Add Project Modal ────────────────────────────────────────────────────────

function AddProjectModal({
	onClose,
	onAdd,
	categories,
}: {
	onClose: () => void;
	onAdd: (
		project: Omit<Project, "id" | "created_at" | "updated_at">,
	) => Promise<void>;
	categories: string[];
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("");
	const [priority, setPriority] = useState<Project["priority"]>("MEDIUM");
	const [status, setStatus] = useState<ProjectStatus>("planning");
	const [progress, setProgress] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [saving, setSaving] = useState(false);
	const [showNewCategory, setShowNewCategory] = useState(false);

	const handleSubmit = async () => {
		if (!title.trim() || !category.trim()) return;
		setSaving(true);
		try {
			await onAdd({
				title: title.trim(),
				description: description.trim() || null,
				category: category.trim(),
				priority,
				status,
				progress: progress ? parseInt(progress) : null,
				due_date: dueDate ? new Date(dueDate).toISOString() : null,
				notes: null,
				key_outcomes: null,
			});
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[520px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden max-h-[90vh] flex flex-col">
				<div className="px-6 pt-5 pb-4 flex-shrink-0">
					<DialogHeader>
						<DialogTitle>Add Project</DialogTitle>
					</DialogHeader>
				</div>

				<div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 border-t border-border/60 pt-4 bg-secondary/20">
					{/* Title */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Title *
						</label>
						<input
							autoFocus
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Project title"
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief overview..."
							rows={2}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
						/>
					</div>

					{/* Category */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Category *
						</label>
						{showNewCategory ? (
							<div className="flex gap-2">
								<input
									autoFocus
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									placeholder="New category name"
									className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								/>
								<button
									type="button"
									onClick={() => {
										setShowNewCategory(false);
										setCategory("");
									}}
									className="text-xs text-muted-foreground hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						) : (
							<select
								value={category}
								onChange={(e) => {
									if (e.target.value === "__new__") {
										setShowNewCategory(true);
										setCategory("");
									} else {
										setCategory(e.target.value);
									}
								}}
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="">Select a category...</option>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
								<option value="__new__">+ Create new category</option>
							</select>
						)}
					</div>

					{/* Priority */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Priority
						</label>
						<div className="flex flex-wrap gap-1.5">
							{(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
								const cfg = PRIORITY_CONFIG[p];
								return (
									<button
										key={p}
										type="button"
										onClick={() => setPriority(p)}
										className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
											priority === p
												? `border-foreground/30 bg-foreground/10 ${cfg.color}`
												: "border-border text-muted-foreground hover:border-foreground/20"
										}`}
									>
										{p}
									</button>
								);
							})}
						</div>
					</div>

					{/* Status - NEW SECTION */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Status
						</label>
						<div className="flex flex-wrap gap-1.5">
							{(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => {
								const cfg = STATUS_CONFIG[s];
								return (
									<button
										key={s}
										type="button"
										onClick={() => setStatus(s)}
										className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
											status === s
												? `border-foreground/30 bg-foreground/10 ${cfg.text}`
												: "border-border text-muted-foreground hover:border-foreground/20"
										}`}
									>
										{cfg.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Progress + Due Date */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Progress (%)
							</label>
							<input
								type="number"
								min="0"
								max="100"
								value={progress}
								onChange={(e) => setProgress(e.target.value)}
								placeholder="0–100"
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Due Date
							</label>
							<input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-1">
						<Button variant="outline" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSubmit}
							disabled={saving || !title.trim() || !category.trim()}
						>
							{saving ? "Adding..." : "Add Project"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({
	projects,
	search,
	onProjectClick,
}: {
	projects: Project[];
	search: string;
	onProjectClick: (p: Project) => void;
}) {
	const stats = useMemo(
		() => ({
			total: projects.length,
			active: projects.filter((p) => p.status === "active").length,
			completed: projects.filter((p) => p.status === "completed").length,
			planning: projects.filter((p) => p.status === "planning").length,
		}),
		[projects],
	);

	const activeProjects = useMemo(
		() => projects.filter((p) => p.status === "active").sort(sortByPriority),
		[projects],
	);

	const completedProjects = useMemo(
		() => projects.filter((p) => p.status === "completed").sort(sortByPriority),
		[projects],
	);

	const filteredProjects = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return [];
		return projects.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				(p.description ?? "").toLowerCase().includes(q),
		);
	}, [projects, search]);

	const isSearching = search.trim().length > 0;

	return (
		<div className="px-4 sm:px-6 py-6 pb-10 space-y-8">
			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{[
					{
						label: "Total",
						value: stats.total,
						icon: Target,
						color: "text-foreground",
						bg: "bg-secondary/60",
					},
					{
						label: "Active",
						value: stats.active,
						icon: Flame,
						color: "text-sky-500",
						bg: "bg-sky-500/10",
					},
					{
						label: "Completed",
						value: stats.completed,
						icon: CheckCircle2,
						color: "text-[#8b9a6b]",
						bg: "bg-[#8b9a6b]/10",
					},
					{
						label: "Planning",
						value: stats.planning,
						icon: Circle,
						color: "text-amber-500",
						bg: "bg-amber-500/10",
					},
				].map(({ label, value, icon: Icon, color, bg }) => (
					<div
						key={label}
						className={`${bg} rounded-xl p-4 flex flex-col gap-2`}
					>
						<Icon className={`w-4 h-4 ${color}`} />
						<p className={`text-2xl font-bold ${color}`}>{value}</p>
						<p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
							{label}
						</p>
					</div>
				))}
			</div>

			{/* Search results */}
			{isSearching && filteredProjects.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
						Search Results
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{filteredProjects.map((p) => (
							<ProjectCard
								key={p.id}
								project={p}
								onClick={() => onProjectClick(p)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Active */}
			{activeProjects.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Flame className="w-3.5 h-3.5 text-sky-500" />
						<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
							Active
						</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{activeProjects.map((p) => (
							<ProjectCard
								key={p.id}
								project={p}
								onClick={() => onProjectClick(p)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Completed */}
			{completedProjects.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="w-3.5 h-3.5 text-[#8b9a6b]" />
						<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
							Completed
						</h3>
						<span className="text-[10px] text-muted-foreground/40 tabular-nums">
							{completedProjects.length}
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{completedProjects.map((p) => (
							<ProjectCard
								key={p.id}
								project={p}
								onClick={() => onProjectClick(p)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Category View ────────────────────────────────────────────────────────────

function CategoryView({
	category,
	projects,
	search,
	onProjectClick,
}: {
	category: string;
	projects: Project[];
	search: string;
	onProjectClick: (p: Project) => void;
}) {
	const filtered = useMemo(() => {
		if (!search.trim()) return projects;
		const q = search.toLowerCase();
		return projects.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				(p.description ?? "").toLowerCase().includes(q),
		);
	}, [projects, search]);

	const grouped = useMemo(() => {
		const order: ProjectStatus[] = [
			"active",
			"planning",
			"paused",
			"completed",
			"archived",
		];
		const map = new Map<ProjectStatus, Project[]>();
		order.forEach((s) => map.set(s, []));
		filtered.forEach((p) => map.get(p.status)?.push(p));
		order.forEach((s) => map.get(s)!.sort(sortByPriority));
		return order
			.filter((s) => map.get(s)!.length > 0)
			.map((s) => ({
				status: s,
				projects: map.get(s)!,
			}));
	}, [filtered]);

	return (
		<div className="px-4 sm:px-6 py-6 pb-10 space-y-8">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold text-foreground">{category}</h2>
				<p className="text-xs text-muted-foreground/60">
					{filtered.length} {filtered.length === 1 ? "project" : "projects"}
				</p>
			</div>

			{filtered.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No projects match your search.
				</p>
			)}

			{grouped.map(({ status, projects: statusProjects }) => {
				const cfg = STATUS_CONFIG[status];
				return (
					<div key={status} className="space-y-3">
						<div className="flex items-center gap-2">
							<div
								className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
							/>
							<h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
								{cfg.label}
							</h3>
							<div className="flex-1 h-px bg-border/40" />
							<span className="text-[10px] text-muted-foreground/40">
								{statusProjects.length}
							</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{statusProjects.map((p) => (
								<ProjectCard
									key={p.id}
									project={p}
									onClick={() => onProjectClick(p)}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Edit Category Modal ──────────────────────────────────────────────────────

function EditCategoryModal({
	category,
	onClose,
	onSave,
}: {
	category: string;
	onClose: () => void;
	onSave: (name: string) => void;
}) {
	const [value, setValue] = useState(category);
	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[400px] p-0 overflow-hidden flex flex-col">
				<div className="px-6 pt-5 pb-4">
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
					</DialogHeader>
				</div>
				<div className="px-6 pb-6 space-y-4 border-t border-border/60 pt-4 bg-secondary/20">
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Name
						</label>
						<input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>
					<div className="flex justify-end gap-2 pt-1">
						<Button variant="outline" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!value.trim()}
							onClick={() => {
								onSave(value.trim());
								onClose();
							}}
						>
							Save
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Project Sidebar ──────────────────────────────────────────────────────────

function ProjectSidebar({
	categories,
	projects,
	activeCategory,
	onSelect,
	onAddProject,
	collapsed,
	onToggleCollapse,
	mobileOpen,
	onMobileClose,
	search,
	setSearch,
	onCategoryContextMenu,
	onCategoryMouseDown,
	onCategoryMouseUp,
}: {
	categories: string[];
	projects: Project[];
	activeCategory: string;
	onSelect: (c: string) => void;
	onAddProject: () => void;
	collapsed: boolean;
	onToggleCollapse: () => void;
	mobileOpen: boolean;
	onMobileClose: () => void;
	search: string;
	setSearch: (s: string) => void;
	onCategoryContextMenu: (e: React.MouseEvent, category: string) => void;
	onCategoryMouseDown: (e: React.MouseEvent, category: string) => void;
	onCategoryMouseUp: () => void;
}) {
	const [addingCategory, setAddingCategory] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const newCategoryInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (addingCategory) newCategoryInputRef.current?.focus();
	}, [addingCategory]);

	const handleNewCategorySubmit = () => {
		const name = newCategoryName.trim();
		if (!name) {
			setAddingCategory(false);
			return;
		}
		onSelect(name);
		setNewCategoryName("");
		setAddingCategory(false);
	};

	const NavItems = ({
		forcedExpanded = false,
	}: {
		forcedExpanded?: boolean;
	}) => {
		const isCollapsed = !forcedExpanded && collapsed;
		return (
			<>
				{/* Overview */}
				<button
					onClick={() => {
						onSelect("__dashboard__");
						onMobileClose();
					}}
					title="Overview"
					className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors
            			${activeCategory === "__dashboard__" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}
            			${isCollapsed ? "justify-center" : ""}`}
				>
					<LayoutDashboard className="w-4 h-4 flex-shrink-0" />
					{!isCollapsed && (
						<span className="truncate flex-1 text-left">Overview</span>
					)}
				</button>

				<div className="h-px bg-border/40 my-1 mx-1" />

				{/* Category rows */}
				{categories.map((cat) => {
					const count = projects.filter((p) => p.category === cat).length;
					const isActive = activeCategory === cat;
					const Icon = getCategoryIcon(cat);
					return (
						<button
							key={cat}
							onClick={() => {
								onSelect(cat);
								onMobileClose();
							}}
							onMouseDown={(e) => onCategoryMouseDown(e, cat)}
							onMouseUp={onCategoryMouseUp}
							onMouseLeave={onCategoryMouseUp}
							onContextMenu={(e) => onCategoryContextMenu(e, cat)}
							title={cat}
							className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors group relative
                			${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}
                			${isCollapsed ? "justify-center" : ""}`}
						>
							<Icon className="w-4 h-4 flex-shrink-0" />
							{!isCollapsed && (
								<>
									<span className="truncate flex-1 text-left text-sm">
										{cat}
									</span>
									<span
										className={`text-[10px] tabular-nums ml-auto flex-shrink-0 ${isActive ? "opacity-70" : "opacity-40"}`}
									>
										{count}
									</span>
								</>
							)}
							{isCollapsed && (
								<span className="absolute -top-1 -right-1 text-[9px] bg-muted text-muted-foreground rounded-full w-4 h-4 flex items-center justify-center leading-none">
									{count}
								</span>
							)}
						</button>
					);
				})}

				<div className="h-px bg-border/40 my-1 mx-1" />

				{/* Inline new category input */}
				{addingCategory && !isCollapsed && (
					<div className="px-2 py-1">
						<input
							ref={newCategoryInputRef}
							value={newCategoryName}
							onChange={(e) => setNewCategoryName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleNewCategorySubmit();
								if (e.key === "Escape") {
									setAddingCategory(false);
									setNewCategoryName("");
								}
							}}
							onBlur={handleNewCategorySubmit}
							placeholder="Category name..."
							className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>
				)}

				{/* Add project */}
				<button
					onClick={onAddProject}
					title="Add Project"
					className={`mt-2 flex items-center px-2 py-3 justify-center gap-1 rounded-lg text-xs font-medium bg-[#8b9a6b]/10 hover:bg-[#8b9a6b]/20 text-[#8b9a6b] transition-colors
            ${isCollapsed ? "w-8 h-8" : "w-full"}`}
				>
					<Plus className="w-3.5 h-3.5 flex-shrink-0" />
					{!isCollapsed && <span>Add Project</span>}
				</button>
			</>
		);
	};

	return (
		<>
			{/* Desktop sidebar */}
			<div className="hidden sm:flex h-full flex-shrink-0 sticky top-0">
				<div
					className={`flex flex-col h-full bg-card border-r border-border/50 transition-all duration-200 ${collapsed ? "w-14" : "w-fit"}`}
				>
					{/* Search */}
					<div
						className={`flex-shrink-0 border-b border-border/50 ${collapsed ? "flex justify-center px-2 py-2" : "px-2 py-2"}`}
					>
						{collapsed ? (
							<button
								onClick={onToggleCollapse}
								title="Expand to search"
								className="p-2 rounded-lg hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-colors"
							>
								<Search className="w-4 h-4" />
							</button>
						) : (
							<div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2.5 py-1.5">
								<Search className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search..."
									className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/30 min-w-0 w-32"
								/>
								{search && (
									<button
										onClick={() => setSearch("")}
										className="text-muted-foreground/40 hover:text-foreground transition-colors flex-shrink-0"
									>
										<X className="w-3 h-3" />
									</button>
								)}

								<button
									onClick={onToggleCollapse}
									className="p-1 rounded-md hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors"
								>
									<ChevronRight
										className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
									/>
								</button>
							</div>
						)}
					</div>

					{/* Nav */}
					<div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2 min-h-0">
						<NavItems />
					</div>
				</div>
			</div>

			{/* Mobile drawer */}
			{mobileOpen && (
				<>
					<div
						className="fixed inset-0 z-40 bg-black/40 sm:hidden"
						onClick={onMobileClose}
					/>
					<div className="fixed inset-y-0 left-0 z-50 sm:hidden">
						<div className="flex flex-col h-full w-64 bg-card border-r border-border/50">
							<div className="flex items-center justify-between px-3 py-3 border-b border-border/50 flex-shrink-0">
								<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
									Projects
								</span>
								<button
									onClick={onMobileClose}
									className="p-1 rounded-md hover:bg-accent text-muted-foreground/60"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
							<div className="flex-shrink-0 px-2 py-2 border-b border-border/50">
								<div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2.5 py-1.5">
									<Search className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
									<input
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Search..."
										className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/30"
									/>
									{search && (
										<button
											onClick={() => setSearch("")}
											className="text-muted-foreground/40 hover:text-foreground"
										>
											<X className="w-3 h-3" />
										</button>
									)}
								</div>
							</div>
							<div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
								<NavItems forcedExpanded />
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}

// ─── Main ProjectView ─────────────────────────────────────────────────────────

export function ProjectView() {
	const {
		projects,
		isLoading,
		handleUpdate,
		handleAdd,
		handleDelete,
		handleStatusChange,
	} = useProjects();

	const [activeCategory, setActiveCategory] = useState("__dashboard__");
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);
	const [showAddModal, setShowAddModal] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [categoryMenu, setCategoryMenu] = useState<{
		category: string;
		x: number;
		y: number;
	} | null>(null);
	const [editingCategory, setEditingCategory] = useState<string | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		if (!categoryMenu) return;
		const handler = () => setCategoryMenu(null);
		window.addEventListener("click", handler);
		return () => window.removeEventListener("click", handler);
	}, [categoryMenu]);

	const handleCategoryMouseDown = (e: React.MouseEvent, category: string) => {
		longPressTimer.current = setTimeout(() => {
			setCategoryMenu({ category, x: e.clientX, y: e.clientY });
		}, 500);
	};

	const handleCategoryMouseUp = () => {
		if (longPressTimer.current) clearTimeout(longPressTimer.current);
	};

	const handleCategoryContextMenu = (e: React.MouseEvent, category: string) => {
		e.preventDefault();
		setCategoryMenu({ category, x: e.clientX, y: e.clientY });
	};

	const handleUpdateCategory = async (oldName: string, newName: string) => {
		const affected = projects.filter((p) => p.category === oldName);
		await Promise.all(
			affected.map((p) => handleUpdate(p.id, { category: newName })),
		);
		if (activeCategory === oldName) setActiveCategory(newName);
	};

	const handleDeleteCategory = async (category: string) => {
		const affected = projects.filter((p) => p.category === category);
		await Promise.all(affected.map((p) => handleDelete(p.id)));
		if (activeCategory === category) setActiveCategory("__dashboard__");
	};

	const selectedProject = useMemo(
		() => projects.find((p) => p.id === selectedProjectId) ?? null,
		[projects, selectedProjectId],
	);

	// ─── UPDATED: Categories sorted by CATEGORY_ORDER ─────────────────────────
	const categories = useMemo(() => {
		const existing = Array.from(new Set(projects.map((p) => p.category)));
		// Sort by CATEGORY_ORDER index, unknown categories at the end
		return existing.sort((a, b) => {
			const indexA = CATEGORY_ORDER.indexOf(a.toLowerCase());
			const indexB = CATEGORY_ORDER.indexOf(b.toLowerCase());
			if (indexA === -1 && indexB === -1) return a.localeCompare(b);
			if (indexA === -1) return 1;
			if (indexB === -1) return -1;
			return indexA - indexB;
		});
	}, [projects]);

	const categoryProjects = useMemo(() => {
		if (activeCategory === "__dashboard__") return [];
		return projects.filter((p) => p.category === activeCategory);
	}, [projects, activeCategory]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
				Loading projects...
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Hamburger — mobile only */}
			<button
				onClick={() => setMobileSidebarOpen(true)}
				className="fixed bottom-5 right-5 sm:hidden p-3 bg-foreground text-background rounded-full shadow-lg hover:bg-foreground/90 transition-all z-50"
				aria-label="Menu"
			>
				<Menu className="w-5 h-5" />
			</button>

			<div className="flex flex-1 min-h-0 overflow-hidden">
				<ProjectSidebar
					categories={categories}
					projects={projects}
					activeCategory={activeCategory}
					onSelect={setActiveCategory}
					onAddProject={() => setShowAddModal(true)}
					collapsed={sidebarCollapsed}
					onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
					mobileOpen={mobileSidebarOpen}
					onMobileClose={() => setMobileSidebarOpen(false)}
					search={search}
					setSearch={setSearch}
					onCategoryContextMenu={handleCategoryContextMenu}
					onCategoryMouseDown={handleCategoryMouseDown}
					onCategoryMouseUp={handleCategoryMouseUp}
				/>

				{/* Main content */}
				<div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
					<div className="flex-1 min-h-0 overflow-y-auto">
						{activeCategory === "__dashboard__" ? (
							<DashboardView
								projects={projects}
								search={debouncedSearch}
								onProjectClick={(p) => setSelectedProjectId(p.id)}
							/>
						) : (
							<CategoryView
								category={activeCategory}
								projects={categoryProjects}
								search={debouncedSearch}
								onProjectClick={(p) => setSelectedProjectId(p.id)}
							/>
						)}
					</div>
				</div>
			</div>

			{selectedProject && (
				<ProjectModal
					project={selectedProject}
					onClose={() => setSelectedProjectId(null)}
					onUpdate={handleUpdate}
					onDelete={async (id) => {
						setSelectedProjectId(null);
						await handleDelete(id);
					}}
					onStatusChange={handleStatusChange}
				/>
			)}

			{showAddModal && (
				<AddProjectModal
					onClose={() => setShowAddModal(false)}
					onAdd={handleAdd}
					categories={categories}
				/>
			)}

			{categoryMenu && (
				<div
					className="fixed flex flex-col z-50 bg-popover border border-border rounded-xl shadow-lg w-fit"
					style={{ top: categoryMenu.y, left: categoryMenu.x }}
					onClick={(e) => e.stopPropagation()}
				>
					<button
						className="text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
						onClick={() => {
							setEditingCategory(categoryMenu.category);
							setCategoryMenu(null);
						}}
					>
						<span className="flex">
							<Edit className="w-4 h-4 shrink-0 mr-2" /> Edit Category
						</span>
					</button>
					<button
						className="text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
						onClick={() => {
							handleDeleteCategory(categoryMenu.category);
							setCategoryMenu(null);
						}}
					>
						<span className="flex">
							<Trash2 className="w-4 h-4 shrink-0 mr-2" /> Delete It
						</span>
					</button>
				</div>
			)}

			{editingCategory && (
				<EditCategoryModal
					category={editingCategory}
					onClose={() => setEditingCategory(null)}
					onSave={(name) => handleUpdateCategory(editingCategory, name)}
				/>
			)}
		</div>
	);
}
