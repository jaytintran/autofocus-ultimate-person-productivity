"use client";

import { formatTimeCompact } from "@/lib/utils/time-utils";

interface ResetConfirmationDialogProps {
	isOpen: boolean;
	totalTimeMs: number;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ResetConfirmationDialog({
	isOpen,
	totalTimeMs,
	onConfirm,
	onCancel,
}: ResetConfirmationDialogProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-sm mx-4">
				<h3 className="text-lg font-semibold mb-2">Reset logged time?</h3>
				<p className="text-sm text-muted-foreground mb-4">
					This will clear{" "}
					<span className="font-medium text-foreground">
						{formatTimeCompact(totalTimeMs)}
					</span>{" "}
					of logged time. This action cannot be undone.
				</p>
				<div className="flex gap-2 justify-end">
					<button
						onClick={onCancel}
						className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
}
