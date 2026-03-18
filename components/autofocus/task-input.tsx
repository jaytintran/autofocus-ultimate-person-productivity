"use client";

import { useState, useCallback, useRef, KeyboardEvent } from "react";
import { Plus } from "lucide-react";

interface TaskInputProps {
	onAddTask: (text: string) => Promise<void>;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
	const [text, setText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = useCallback(async () => {
		const trimmed = text.trim();
		if (!trimmed || isLoading) return;

		setIsLoading(true);
		try {
			await onAddTask(trimmed);
			setText("");
			inputRef.current?.focus();
		} finally {
			setIsLoading(false);
		}
	}, [text, isLoading, onAddTask]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	return (
		<div className="border-t border-border bg-card px-6 py-3">
			<div className="flex items-center gap-3">
				<Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
				<input
					ref={inputRef}
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Add a task..."
					disabled={isLoading}
					className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
				/>
				<button
					onClick={handleSubmit}
					disabled={!text.trim() || isLoading}
					className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
				>
					Add
				</button>
			</div>
		</div>
	);
}
