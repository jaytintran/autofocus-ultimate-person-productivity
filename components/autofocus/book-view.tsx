"use client";

import { useState, useMemo, useCallback } from "react";
import {
	Search,
	Plus,
	Star,
	BookOpen,
	X,
	ChevronRight,
	Flame,
	CheckCircle2,
	Circle,
	BookMarked,
	Layers,
	ArrowLeft,
} from "lucide-react";
import { useBooks } from "@/hooks/use-books";
import type { Book, BookStatus, BookPriority } from "@/lib/books";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
	BookStatus,
	{ label: string; dot: string; text: string; bg: string }
> = {
	unread: {
		label: "Not Started",
		dot: "bg-muted-foreground/30",
		text: "text-muted-foreground",
		bg: "bg-muted/50",
	},
	reading: {
		label: "Reading",
		dot: "bg-sky-500",
		text: "text-sky-500",
		bg: "bg-sky-500/10",
	},
	completed: {
		label: "Completed",
		dot: "bg-[#8b9a6b]",
		text: "text-[#8b9a6b]",
		bg: "bg-[#8b9a6b]/10",
	},
	abandoned: {
		label: "Abandoned",
		dot: "bg-muted-foreground/20",
		text: "text-muted-foreground/40",
		bg: "bg-muted/30",
	},
};

const PRIORITY_CONFIG: Record<
	string,
	{ label: string; color: string; bg: string; order: number }
> = {
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
	SUPPLEMENTAL: {
		label: "SUPP",
		color: "text-blue-400",
		bg: "bg-blue-400/10",
		order: 3,
	},
	LOW: {
		label: "LOW",
		color: "text-muted-foreground",
		bg: "bg-muted",
		order: 4,
	},
};

const DOMAIN_SHORT: Record<string, string> = {
	"Mental Sovereignty": "Mental",
	"Psychological X-Ray Vision": "Psych",
	"Power, Influence & Social Strategy": "Power",
	"Strategic Thinking & Wealth": "Strategy",
	"Reality Creation & Perception Control": "Reality",
	"Philosophical Invincibility": "Philosophy",
	"Day Trading Mastery": "Trading",
	"Health, Fitness, & Human Performance": "Health",
	"AI, Technology, & Software": "AI & Tech",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByPriority(a: Book, b: Book): number {
	const pa = PRIORITY_CONFIG[a.priority ?? "LOW"]?.order ?? 99;
	const pb = PRIORITY_CONFIG[b.priority ?? "LOW"]?.order ?? 99;
	return pa - pb || a.title.localeCompare(b.title);
}

// ─── Book Card ────────────────────────────────────────────────────────────────

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
	const status = STATUS_CONFIG[book.status];
	const priority = book.priority ? PRIORITY_CONFIG[book.priority] : null;
	const progress =
		book.total_pages && book.current_page
			? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
			: null;

	return (
		<div
			onClick={onClick}
			className="group relative bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-border/80 hover:bg-accent/30 transition-all duration-150 flex flex-col gap-3"
		>
			{/* Status + Priority row */}
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

			{/* Title + Author */}
			<div className="flex-1 min-w-0">
				<p
					className={`text-sm font-medium leading-snug line-clamp-2 ${book.status === "completed" ? "text-muted-foreground" : "text-foreground"}`}
				>
					{book.title}
				</p>
				<p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
					{book.author}
				</p>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between gap-2">
				{book.rating ? (
					<div className="flex items-center gap-0.5">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								className={`w-2.5 h-2.5 ${i < Math.round(book.rating!) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
							/>
						))}
					</div>
				) : (
					<span className="text-[10px] text-muted-foreground/30">
						{book.book_type}
					</span>
				)}

				{/* Progress bar */}
				{progress !== null && (
					<div className="flex items-center gap-1.5 flex-shrink-0">
						<div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
							<div
								className="h-full bg-[#8b9a6b] rounded-full transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<span className="text-[10px] text-[#8b9a6b]">{progress}%</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Book Detail Modal ────────────────────────────────────────────────────────

function BookModal({
	book,
	onClose,
	onUpdate,
	onDelete,
	onStatusChange,
}: {
	book: Book;
	onClose: () => void;
	onUpdate: (id: string, updates: Partial<Book>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onStatusChange: (id: string, status: BookStatus) => Promise<void>;
}) {
	const [notes, setNotes] = useState(book.notes ?? "");
	const [takeaways, setTakeaways] = useState(book.key_takeaways ?? "");
	const [currentPage, setCurrentPage] = useState(
		book.current_page?.toString() ?? "",
	);
	const [totalPages, setTotalPages] = useState(
		book.total_pages?.toString() ?? "",
	);
	const [isSaving, setIsSaving] = useState(false);
	const [localStatus, setLocalStatus] = useState<BookStatus>(book.status);

	const progress =
		totalPages && currentPage
			? Math.min(
					100,
					Math.round((parseInt(currentPage) / parseInt(totalPages)) * 100),
				)
			: null;

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onUpdate(book.id, {
				notes: notes.trim() || null,
				key_takeaways: takeaways.trim() || null,
				current_page: currentPage ? parseInt(currentPage) : null,
				total_pages: totalPages ? parseInt(totalPages) : null,
			});
			if (localStatus !== book.status) {
				await onStatusChange(book.id, localStatus);
			}
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	const priority = book.priority ? PRIORITY_CONFIG[book.priority] : null;

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[580px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="px-6 pt-5 pb-4 flex-shrink-0">
					<DialogHeader>
						<DialogTitle className="text-base leading-snug pr-6 text-foreground">
							{book.title}
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>

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
							{book.domain}
						</span>
						{book.layer && (
							<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
								{book.layer}
							</span>
						)}
						{book.rating && (
							<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
								<Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
								{book.rating}
							</span>
						)}
					</div>

					{/* Status selector */}
					<div className="flex items-center gap-1.5 mt-3 flex-wrap">
						{(Object.keys(STATUS_CONFIG) as BookStatus[]).map((s) => {
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

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 border-t border-border/60 pt-4 bg-secondary/20">
					{/* Progress */}
					{(localStatus === "reading" || localStatus === "completed") && (
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Progress
							</label>
							<div className="flex items-center gap-2">
								<input
									type="number"
									value={currentPage}
									onChange={(e) => setCurrentPage(e.target.value)}
									placeholder="Page"
									className="w-20 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								/>
								<span className="text-muted-foreground text-sm">/</span>
								<input
									type="number"
									value={totalPages}
									onChange={(e) => setTotalPages(e.target.value)}
									placeholder="Total"
									className="w-24 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								/>
								{progress !== null && (
									<span className="text-sm text-[#8b9a6b] font-medium">
										{progress}%
									</span>
								)}
							</div>
							{progress !== null && (
								<div className="h-1.5 bg-secondary rounded-full overflow-hidden">
									<div
										className="h-full bg-[#8b9a6b] rounded-full transition-all"
										style={{ width: `${progress}%` }}
									/>
								</div>
							)}
						</div>
					)}

					{/* Notes */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Raw thoughts while reading..."
							rows={4}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
						/>
					</div>

					{/* Key Takeaways */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Key Takeaways
						</label>
						<textarea
							value={takeaways}
							onChange={(e) => setTakeaways(e.target.value)}
							placeholder="Distilled lessons, one per line..."
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
								await onDelete(book.id);
							}}
							className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
						>
							Delete book
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

// ─── Add Book Modal ───────────────────────────────────────────────────────────

function AddBookModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (
		book: Omit<Book, "id" | "created_at" | "updated_at">,
	) => Promise<void>;
}) {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [domain, setDomain] = useState("");
	const [layer, setLayer] = useState("");
	const [priority, setPriority] = useState<Book["priority"]>("MEDIUM");
	const [bookType, setBookType] = useState<Book["book_type"]>("Core");
	const [totalPages, setTotalPages] = useState("");
	const [rating, setRating] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!title.trim() || !author.trim() || !domain.trim()) return;
		setSaving(true);
		try {
			await onAdd({
				title: title.trim(),
				author: author.trim(),
				domain: domain.trim(),
				layer: layer.trim() || null,
				priority,
				rating: rating ? parseFloat(rating) : null,
				book_type: bookType,
				status: "unread",
				started_at: null,
				finished_at: null,
				current_page: null,
				total_pages: totalPages ? parseInt(totalPages) : null,
				notes: null,
				key_takeaways: null,
				cover_url: null,
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
						<DialogTitle>Add Book</DialogTitle>
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
							placeholder="Book title"
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>

					{/* Author */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Author *
						</label>
						<input
							value={author}
							onChange={(e) => setAuthor(e.target.value)}
							placeholder="Author name"
							className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>

					{/* Domain + Layer */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Domain *
							</label>
							<input
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								placeholder="e.g. Mental Sovereignty"
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Layer
							</label>
							<input
								value={layer}
								onChange={(e) => setLayer(e.target.value)}
								placeholder="e.g. Layer 1 — Foundation"
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
					</div>

					{/* Priority */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Priority
						</label>
						<div className="flex flex-wrap gap-1.5">
							{(
								["CRITICAL", "HIGH", "MEDIUM", "SUPPLEMENTAL", "LOW"] as const
							).map((p) => {
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

					{/* Book Type */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
							Type
						</label>
						<div className="flex gap-1.5">
							{(["Core", "Optional", "Extension"] as const).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setBookType(t)}
									className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
										bookType === t
											? "border-foreground/30 bg-foreground/10 text-foreground"
											: "border-border text-muted-foreground hover:border-foreground/20"
									}`}
								>
									{t}
								</button>
							))}
						</div>
					</div>

					{/* Total Pages + Rating */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Total Pages
							</label>
							<input
								type="number"
								value={totalPages}
								onChange={(e) => setTotalPages(e.target.value)}
								placeholder="e.g. 320"
								className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
								Rating (0–5)
							</label>
							<input
								type="number"
								min="0"
								max="5"
								step="0.5"
								value={rating}
								onChange={(e) => setRating(e.target.value)}
								placeholder="e.g. 4.5"
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
							disabled={
								saving || !title.trim() || !author.trim() || !domain.trim()
							}
						>
							{saving ? "Adding..." : "Add Book"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({
	books,
	search,
	onBookClick,
}: {
	books: Book[];
	search: string;
	onBookClick: (book: Book) => void;
}) {
	const stats = useMemo(
		() => ({
			total: books.length,
			reading: books.filter((b) => b.status === "reading").length,
			completed: books.filter((b) => b.status === "completed").length,
			unread: books.filter((b) => b.status === "unread").length,
		}),
		[books],
	);

	const criticalUnread = useMemo(
		() =>
			books
				.filter((b) => b.priority === "CRITICAL" && b.status === "unread")
				.sort(sortByPriority)
				.slice(0, 6),
		[books],
	);

	const currentlyReading = useMemo(
		() => books.filter((b) => b.status === "reading").sort(sortByPriority),
		[books],
	);

	const filteredBooks = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return [];

		return books.filter(
			(b) =>
				b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
		);
	}, [books, search]);

	const isSearching = search.trim().length > 0;

	return (
		<div className="px-4 sm:px-6 py-6 pb-10 space-y-8">
			{/* Stats grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{[
					{
						label: "Total Books",
						value: stats.total,
						icon: BookOpen,
						color: "text-foreground",
						bg: "bg-secondary/60",
					},
					{
						label: "Reading",
						value: stats.reading,
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
						label: "Not Started",
						value: stats.unread,
						icon: Circle,
						color: "text-muted-foreground",
						bg: "bg-secondary/60",
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

			{/* Filtered books */}
			{isSearching && filteredBooks.length === 0 ? (
				<p className="text-sm text-muted-foreground">No books found.</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{filteredBooks.map((book) => (
						<BookCard
							key={book.id}
							book={book}
							onClick={() => onBookClick(book)}
						/>
					))}
				</div>
			)}

			{/* Currently Reading */}
			{currentlyReading.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Flame className="w-3.5 h-3.5 text-sky-500" />
						<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
							Currently Reading
						</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{currentlyReading.map((book) => (
							<BookCard
								key={book.id}
								book={book}
								onClick={() => onBookClick(book)}
							/>
						))}
					</div>
				</div>
			)}
			{/* Critical unread */}
			{criticalUnread.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-red-500" />
						<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
							Critical Priority — Up Next
						</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{criticalUnread.map((book) => (
							<BookCard
								key={book.id}
								book={book}
								onClick={() => onBookClick(book)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Domain View ──────────────────────────────────────────────────────────────

function DomainView({
	domain,
	books,
	search,
	onBookClick,
}: {
	domain: string;
	books: Book[];
	search: string;
	onBookClick: (book: Book) => void;
}) {
	const filtered = useMemo(() => {
		if (!search.trim()) return books;
		const q = search.toLowerCase();
		return books.filter(
			(b) =>
				b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
		);
	}, [books, search]);

	// Group by layer — null layer books go first, unlabeled
	const grouped = useMemo(() => {
		const nullBooks = filtered.filter((b) => !b.layer).sort(sortByPriority);
		const layerMap = new Map<string, Book[]>();

		filtered
			.filter((b) => !!b.layer)
			.forEach((b) => {
				const l = b.layer!;
				if (!layerMap.has(l)) layerMap.set(l, []);
				layerMap.get(l)!.push(b);
			});

		// Sort layer keys naturally
		const sortedLayers = Array.from(layerMap.keys()).sort();

		return {
			nullBooks,
			layers: sortedLayers.map((l) => ({
				label: l,
				books: layerMap.get(l)!.sort(sortByPriority),
			})),
		};
	}, [filtered]);

	const total = filtered.length;

	return (
		<div className="px-4 sm:px-6 py-6 pb-10 space-y-8">
			{/* Domain header */}
			<div className="space-y-1">
				<h2 className="text-lg font-semibold text-foreground">{domain}</h2>
				<p className="text-xs text-muted-foreground/60">
					{total} {total === 1 ? "book" : "books"}
				</p>
			</div>
			{total === 0 && (
				<p className="text-sm text-muted-foreground">
					No books match your search.
				</p>
			)}
			{/* Unlabeled books first */}
			{grouped.nullBooks.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{grouped.nullBooks.map((book) => (
						<BookCard
							key={book.id}
							book={book}
							onClick={() => onBookClick(book)}
						/>
					))}
				</div>
			)}
			{/* Layered groups */}
			{grouped.layers.map(({ label, books: layerBooks }) => (
				<div key={label} className="space-y-3">
					<div className="flex items-center gap-2">
						<Layers className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
						<h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
							{label}
						</h3>
						<div className="flex-1 h-px bg-border/40" />
						<span className="text-[10px] text-muted-foreground/40">
							{layerBooks.length}
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{layerBooks.map((book) => (
							<BookCard
								key={book.id}
								book={book}
								onClick={() => onBookClick(book)}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Main BookView ────────────────────────────────────────────────────────────

export function BookView() {
	const {
		books,
		isLoading,
		handleUpdate,
		handleAdd,
		handleDelete,
		handleStatusChange,
	} = useBooks();
	const [activeDomain, setActiveDomain] = useState<string>("__dashboard__");
	const [search, setSearch] = useState("");
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);

	// Derive ordered domain list from actual data
	const domains = useMemo(() => {
		const d = new Set(books.map((b) => b.domain));
		return Array.from(d).sort();
	}, [books]);

	const domainBooks = useMemo(() => {
		if (activeDomain === "__dashboard__") return [];
		return books.filter((b) => b.domain === activeDomain);
	}, [books, activeDomain]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
				Loading library...
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Top action bar */}
			<div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-border/50 flex-shrink-0">
				{/* Search */}
				<div className="flex items-center gap-2 flex-1 bg-secondary/50 rounded-lg px-3 py-1.5">
					<Search className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search title or author..."
						className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
					/>
					{search && (
						<button
							onClick={() => setSearch("")}
							className="text-muted-foreground/50 hover:text-foreground transition-colors"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				{/* Add book */}
				<button
					onClick={() => setShowAddModal(true)}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8b9a6b]/10 hover:bg-[#8b9a6b]/20 text-[#8b9a6b] rounded-lg text-xs font-medium transition-colors flex-shrink-0"
				>
					<Plus className="w-3.5 h-3.5" />
					<span className="hidden sm:inline">Add Book</span>
				</button>
			</div>
			{/* Domain pill strip */}
			<div className="flex-shrink-0 border-b border-border/50 overflow-x-auto">
				<div className="flex items-center gap-1 px-4 sm:px-6 py-2 w-max min-w-full">
					{/* Dashboard pill */}
					<button
						onClick={() => setActiveDomain("__dashboard__")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
							activeDomain === "__dashboard__"
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground hover:bg-accent"
						}`}
					>
						<BookMarked className="w-3 h-3" />
						Overview
					</button>

					<div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />

					{domains.map((domain) => {
						const count = books.filter((b) => b.domain === domain).length;
						const short = DOMAIN_SHORT[domain] ?? domain;
						const isActive = activeDomain === domain;
						return (
							<button
								key={domain}
								onClick={() => setActiveDomain(domain)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
									isActive
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground hover:bg-accent"
								}`}
							>
								{short}
								<span
									className={`text-[10px] tabular-nums ${
										isActive ? "opacity-70" : "opacity-50"
									}`}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			{/* Main content */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				{activeDomain === "__dashboard__" ? (
					<DashboardView
						// books={
						// 	search.trim()
						// 		? books.filter(
						// 				(b) =>
						// 					b.title.toLowerCase().includes(search.toLowerCase()) ||
						// 					b.author.toLowerCase().includes(search.toLowerCase()),
						// 			)
						// 		: books
						// }
						books={books}
						search={search}
						onBookClick={setSelectedBook}
					/>
				) : (
					<DomainView
						domain={activeDomain}
						books={domainBooks}
						search={search}
						onBookClick={setSelectedBook}
					/>
				)}
			</div>
			{/* Book detail modal */}
			{selectedBook && (
				<BookModal
					book={selectedBook}
					onClose={() => setSelectedBook(null)}
					onUpdate={async (id, updates) => {
						await handleUpdate(id, updates);
						setSelectedBook((prev) =>
							prev?.id === id ? { ...prev, ...updates } : prev,
						);
					}}
					onDelete={async (id) => {
						setSelectedBook(null);
						await handleDelete(id);
					}}
					onStatusChange={async (id, status) => {
						await handleStatusChange(id, status);
						setSelectedBook((prev) =>
							prev?.id === id ? { ...prev, status } : prev,
						);
					}}
				/>
			)}
			{/* Add book modal */}
			{showAddModal && (
				<AddBookModal
					onClose={() => setShowAddModal(false)}
					onAdd={handleAdd}
				/>
			)}
		</div>
	);
}
