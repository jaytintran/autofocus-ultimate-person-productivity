"use client";

import { useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";

interface BacklogDumpProps {
	onAddTasks: (tasks: string[]) => Promise<void>;
}

export function BacklogDump({ onAddTasks }: BacklogDumpProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = useCallback(async () => {
		const lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		if (lines.length === 0 || isLoading) return;

		setIsLoading(true);
		try {
			await onAddTasks(lines);
			setText("");
			setIsOpen(false);
		} finally {
			setIsLoading(false);
		}
	}, [text, isLoading, onAddTasks]);

	return (
		<div className="border-t border-border">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ChevronRight
					className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
				/>
				<span className="uppercase tracking-wider">Backlog Dump</span>
			</button>

			{isOpen && (
				<div className="px-6 pb-4">
					<p className="text-xs text-muted-foreground mb-2">
						Paste multiple tasks, one per line. They will be added to the end of
						your list.
					</p>
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Buy groceries&#10;Call mom&#10;Review project proposal&#10;..."
						disabled={isLoading}
						className="w-full h-32 bg-input border border-border rounded p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
					/>
					<div className="flex justify-end mt-2">
						<button
							onClick={handleSubmit}
							disabled={!text.trim() || isLoading}
							className="px-4 py-1.5 text-sm bg-secondary hover:bg-accent text-foreground rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
						>
							{isLoading ? "Adding..." : "Add All"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
