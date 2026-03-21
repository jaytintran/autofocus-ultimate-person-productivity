"use client";

import {
	ChevronLeft,
	ChevronRight,
	FunnelPlus,
	LibraryBig,
} from "lucide-react";
import Link from "next/link";

import * as Tooltip from "@radix-ui/react-tooltip";

function SecondBrainButton() {
	return (
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<Link
						href="https://www.notion.so/Object-Types-31fa0f71b1028081a7b1fb21811f82b0?source=copy_link"
						target="_blank"
					>
						<button className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-full p-1.75 hover:bg-accent transition-colors">
							<LibraryBig className="w-4 h-4" />
						</button>
					</Link>
				</Tooltip.Trigger>

				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						className="bg-foreground text-background text-xs px-2 py-1 rounded-md shadow-md"
					>
						Open Docs
						<Tooltip.Arrow className="fill-foreground" />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}

interface PageNavProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	isFiltered?: boolean;
}

export function PageNav({
	currentPage,
	totalPages,
	onPageChange,
	isFiltered = false,
}: PageNavProps) {
	return (
		<div className="flex items-center justify-between px-4 py-2 border-b items-center">
			{/* Left side — page navigation */}
			<div className="flex items-center gap-2 mt-1">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					aria-label="Previous page"
				>
					<ChevronLeft className="w-4.5 h-4.5" />
				</button>
				<span className="text-sm text-muted-foreground flex items-center gap-2">
					{currentPage} of {totalPages}
					{isFiltered && (
						<FunnelPlus className="w-6 h-6 border border-transparent p-1" />
					)}
				</span>
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					aria-label="Next page"
				>
					<ChevronRight className="w-4.5 h-4.5" />
				</button>
			</div>

			{/* Right side — Manage Lists button */}
			<SecondBrainButton />
		</div>
	);
}
