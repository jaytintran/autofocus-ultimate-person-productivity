export const PAMPHLET_COLORS = {
	slate: {
		label: "Slate",
		bg: "bg-slate-500/15",
		text: "text-slate-400",
		border: "border-slate-500/40",
		dot: "bg-slate-400",
	},
	red: {
		label: "Red",
		bg: "bg-red-500/15",
		text: "text-red-400",
		border: "border-red-500/40",
		dot: "bg-red-400",
	},
	orange: {
		label: "Orange",
		bg: "bg-orange-500/15",
		text: "text-orange-400",
		border: "border-orange-500/40",
		dot: "bg-orange-400",
	},
	amber: {
		label: "Amber",
		bg: "bg-amber-500/15",
		text: "text-amber-400",
		border: "border-amber-500/40",
		dot: "bg-amber-400",
	},
	green: {
		label: "Green",
		bg: "bg-green-500/15",
		text: "text-green-400",
		border: "border-green-500/40",
		dot: "bg-green-400",
	},
	teal: {
		label: "Teal",
		bg: "bg-teal-500/15",
		text: "text-teal-400",
		border: "border-teal-500/40",
		dot: "bg-teal-400",
	},
	blue: {
		label: "Blue",
		bg: "bg-blue-500/15",
		text: "text-blue-400",
		border: "border-blue-500/40",
		dot: "bg-blue-400",
	},
	violet: {
		label: "Violet",
		bg: "bg-violet-500/15",
		text: "text-violet-400",
		border: "border-violet-500/40",
		dot: "bg-violet-400",
	},
	pink: {
		label: "Pink",
		bg: "bg-pink-500/15",
		text: "text-pink-400",
		border: "border-pink-500/40",
		dot: "bg-pink-400",
	},
	rose: {
		label: "Rose",
		bg: "bg-rose-500/15",
		text: "text-rose-400",
		border: "border-rose-500/40",
		dot: "bg-rose-400",
	},
} as const;

export type PamphletColor = keyof typeof PAMPHLET_COLORS;

export const PAMPHLET_COLOR_LIST = Object.keys(
	PAMPHLET_COLORS,
) as PamphletColor[];
