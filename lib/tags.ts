export const TAG_DEFINITIONS = [
	{ id: "finish" as const, label: "Finish", emoji: "🎯" },
	{ id: "explore" as const, label: "Explore", emoji: "🧭" },
	{ id: "quick" as const, label: "Quick", emoji: "⚡" },
	{ id: "handle" as const, label: "Handle", emoji: "🔧" },
] as const;

export type TagId = (typeof TAG_DEFINITIONS)[number]["id"];

export function getTagDefinition(tagId: TagId | null) {
	return TAG_DEFINITIONS.find((t) => t.id === tagId) || null;
}
