"use client";

import { useRef, useEffect } from "react";

interface PageCarouselStripesProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export function PageCarouselStripes({
	currentPage,
	totalPages,
	onPageChange,
}: PageCarouselStripesProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const touchStartX = useRef<number>(0);
	const touchEndX = useRef<number>(0);

	// Don't render if only 1 page
	if (totalPages <= 1) return null;

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		touchEndX.current = e.touches[0].clientX;
	};

	const handleTouchEnd = () => {
		const diff = touchStartX.current - touchEndX.current;
		const threshold = 50; // minimum swipe distance

		if (Math.abs(diff) > threshold) {
			if (diff > 0 && currentPage < totalPages) {
				// Swiped left - next page
				onPageChange(currentPage + 1);
			} else if (diff < 0 && currentPage > 1) {
				// Swiped right - previous page
				onPageChange(currentPage - 1);
			}
		}
	};

	return (
		<div
			ref={containerRef}
			className="h-12 flex items-center justify-start pl-6"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div className="flex items-center gap-2">
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
					<button
						key={page}
						onClick={() => onPageChange(page)}
						className={`h-1.5 w-12 rounded-full transition-colors ${
							page === currentPage
								? "bg-[#8b9a6b]"
								: "bg-muted-foreground/20 hover:bg-muted-foreground/40"
						}`}
						aria-label={`Go to page ${page}`}
					/>
				))}
			</div>
		</div>
	);
}
