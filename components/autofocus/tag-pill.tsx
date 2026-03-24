"use client";

import { useState } from "react";
import { TAG_DEFINITIONS, getTagDefinition, type TagId } from "@/lib/tags";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface TagPillProps {
	tagId: TagId | null;
	onSelectTag: (tag: TagId | null) => void;
	disabled?: boolean;
	className?: string;
}

export function TagPill({
	tagId,
	onSelectTag,
	disabled,
	className,
}: TagPillProps) {
	const [open, setOpen] = useState(false);
	const tag = tagId ? getTagDefinition(tagId) : null;

	const handleSelect = (selected: TagId | null) => {
		onSelectTag(selected);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
			<PopoverTrigger asChild>
				<button
					disabled={disabled}
					className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-colors
            ${
							tag
								? "bg-[#8b9a6b]/10 dark:bg-gray-700/50 hover:bg-[#8b9a6b]/20 dark:hover:bg-gray-700"
								: "bg-muted/40 hover:bg-muted text-muted-foreground border border-dashed border-muted-foreground/30"
						} ${className ?? ""}`}
					onClick={(e) => e.stopPropagation()}
				>
					{tag ? (
						<>
							<span>{tag.emoji}</span>
							<span>{tag.label}</span>
						</>
					) : (
						<span>No 🏷️</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-52 p-2" align="end">
				<div className="flex flex-col gap-1">
					{TAG_DEFINITIONS.map((t) => (
						<button
							key={t.id}
							onClick={() => handleSelect(t.id)}
							className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-left"
						>
							<span>{t.emoji}</span>
							<span>{t.label}</span>
						</button>
					))}
					{tagId && (
						<>
							<div className="border-t my-1" />
							<button
								onClick={() => handleSelect(null)}
								className="px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-left text-muted-foreground"
							>
								Remove tag
							</button>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
