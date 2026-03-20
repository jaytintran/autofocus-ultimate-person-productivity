"use client";

import { ChevronLeft, ChevronRight, FunnelPlus } from "lucide-react";

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
		<div className="flex items-center justify-center gap-4 py-2 border-b">
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage <= 1}
				className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
				aria-label="Previous page"
			>
				<ChevronLeft className="w-4 h-4" />
			</button>
			<span className="text-sm text-muted-foreground flex items-center gap-2">
				Page {currentPage} of {totalPages}
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
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}
