import { useState, useEffect } from "react";
import type { CompletedSortKey, CompletedViewType } from "@/components/layout/view-tabs";
import type { ContentFilterState } from "@/lib/features/content-filter";

interface ViewPreferences {
	completedSort: CompletedSortKey;
	completedViewType: CompletedViewType;
	contentFilter: ContentFilterState;
	buJoWidth: "full" | "narrow";
}

const DEFAULT_PREFERENCES: ViewPreferences = {
	completedSort: "default",
	completedViewType: "bullet",
	contentFilter: {
		options: [],
		preset: "show-all",
	},
	buJoWidth: "full",
};

const STORAGE_KEY = "autofocus-view-preferences";

export function useViewPreferences() {
	const [preferences, setPreferences] = useState<ViewPreferences>(() => {
		if (typeof window === "undefined") return DEFAULT_PREFERENCES;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				return { ...DEFAULT_PREFERENCES, ...parsed };
			}
		} catch (error) {
			console.error("Failed to load view preferences:", error);
		}

		return DEFAULT_PREFERENCES;
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
		} catch (error) {
			console.error("Failed to save view preferences:", error);
		}
	}, [preferences]);

	const setCompletedSort = (sort: CompletedSortKey) => {
		setPreferences((prev) => ({ ...prev, completedSort: sort }));
	};

	const setCompletedViewType = (viewType: CompletedViewType) => {
		setPreferences((prev) => ({ ...prev, completedViewType: viewType }));
	};

	const setContentFilter = (filter: ContentFilterState) => {
		setPreferences((prev) => ({ ...prev, contentFilter: filter }));
	};

	const setBuJoWidth = (width: "full" | "narrow") => {
		setPreferences((prev) => ({ ...prev, buJoWidth: width }));
	};

	return {
		completedSort: preferences.completedSort,
		completedViewType: preferences.completedViewType,
		contentFilter: preferences.contentFilter,
		buJoWidth: preferences.buJoWidth,
		setCompletedSort,
		setCompletedViewType,
		setContentFilter,
		setBuJoWidth,
	};
}
