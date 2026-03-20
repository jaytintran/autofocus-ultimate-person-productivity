"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { getAppState, updateAppState } from "@/lib/store";
import type { DefaultFilter } from "@/lib/types";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const { data: appState, mutate: mutateAppState } = useSWR(
		isOpen ? "app-state" : null,
		getAppState,
	);
	const [defaultFilter, setDefaultFilter] = useState<DefaultFilter>("all");

	useEffect(() => {
		if (appState?.default_filter) {
			setDefaultFilter(appState.default_filter);
		}
	}, [appState]);

	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	const handleFilterChange = async (filter: DefaultFilter) => {
		setDefaultFilter(filter);
		await updateAppState({ default_filter: filter });
		await mutateAppState();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
			onClick={onClose}
		>
			<div
				className="bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold">Settings</h2>
					<button
						onClick={onClose}
						className="p-1 hover:bg-accent rounded transition-colors"
						aria-label="Close"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="p-4 space-y-6">
					<div>
						<h3 className="text-sm font-medium mb-3">Display Preferences</h3>
						<div className="space-y-2">
							<label className="text-sm text-muted-foreground">
								Default filter on load
							</label>
							<div className="flex gap-2">
								<button
									onClick={() => handleFilterChange("all")}
									className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
										defaultFilter === "all"
											? "bg-primary text-primary-foreground"
											: "bg-muted hover:bg-muted/80"
									}`}
								>
									All Tags
								</button>
								<button
									onClick={() => handleFilterChange("none")}
									className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
										defaultFilter === "none"
											? "bg-primary text-primary-foreground"
											: "bg-muted hover:bg-muted/80"
									}`}
								>
									No 🏷️
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
