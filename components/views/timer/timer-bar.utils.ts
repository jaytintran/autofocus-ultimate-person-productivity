import { TAG_DEFINITIONS, type TagId } from "@/lib/tags";

// =============================================================================
// TIMER DISPLAY
// =============================================================================

export function formatTimerDisplay(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// =============================================================================
// TEXT FORMATTING
// =============================================================================

const EXEMPT_WORDS = new Set([
	"a",
	"an",
	"and",
	"of",
	"the",
	"on",
	"to",
	"at",
	"by",
]);

export function capitalizeText(text: string): string {
	return text
		.split(" ")
		.map((w, i) =>
			i === 0 || !EXEMPT_WORDS.has(w.toLowerCase())
				? w.charAt(0).toUpperCase() + w.slice(1)
				: w.toLowerCase(),
		)
		.join(" ");
}

// =============================================================================
// TAG MENTION PARSING
// =============================================================================

// Defined outside component — stable reference, no recreation on render
export const TAG_MENTION_MAP: Record<string, TagId> = Object.fromEntries(
	TAG_DEFINITIONS.map((tag) => [`#${tag.id}`, tag.id]),
);

export function parseTagMention(text: string): {
	tag: TagId | null;
	cleanText: string;
} {
	const lower = text.toLowerCase();
	for (const [mention, tagId] of Object.entries(TAG_MENTION_MAP)) {
		const regex = new RegExp(`${mention}(\\s|$)`, "i");
		if (regex.test(lower)) {
			return { tag: tagId, cleanText: text.replace(regex, "").trim() };
		}
	}
	return { tag: null, cleanText: text };
}

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const primaryBtn =
	"items-center justify-center gap-2 rounded-sm border border-[#a3b56a]/40 bg-[#a3b56a] px-4 py-2 text-sm font-medium text-[#1f2414] transition-colors hover:bg-[#b2c777] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryBtn =
	"items-center justify-center gap-2 rounded-sm border border-border bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
export const iconBtn =
	"inline-flex items-center justify-center rounded-sm border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";
