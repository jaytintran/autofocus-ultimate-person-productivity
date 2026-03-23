"use client";

import { useState } from "react";
import { TAG_DEFINITIONS, type TagId } from "@/lib/tags";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const TAG_GUIDE = [
	{
		emoji: "🎯",
		label: "Finish",
		description:
			'Outcome-driven work with a clear completion state. You know exactly what "done" looks like before you start. These re-enter perfectly because the intent survives every cycle.',
		examples: [
			"Finish the book Psycho-Cybernetics",
			"Finish the homepage of the portfolio",
			"Finish Module 3 of the negotiation course",
			"Finish the Q3 section of the quarterly report",
			"Finish the first draft of the investor proposal",
		],
		note: null,
	},
	{
		emoji: "🧭",
		label: "Explore",
		description:
			"Intentionally open-ended work where the output is clarity, not a deliverable. You go in not knowing what you'll find. The task is to emerge with something more concrete — which then becomes the next 🎯 Finish task.",
		examples: [
			"Explore ideas for the new app feature",
			"Research standing desk options",
			"Work on the content strategy direction",
			"Look into visa requirements for Japan",
			"Browse reference designs for the landing page",
		],
		note: "These don't have a fixed end state — and that's intentional. Once you've explored, you'll know what to Finish next.",
	},
	{
		emoji: "⚡",
		label: "Quick",
		description:
			"Single-shot tasks that take one sitting, have no re-entry scenario, and don't need to survive multiple cycles. Low friction, high throughput. If it takes under 15 minutes and you'll never need to re-enter it, it's a Quick.",
		examples: [
			"Read the Stratechery piece on Apple",
			"Reply to Marco's email about the meeting",
			"Pay the electricity bill",
			"Watch the 8-minute video on cold outreach",
			"Book the airport transfer for Friday",
		],
		note: null,
	},
	{
		emoji: "🔧",
		label: "Handle",
		description:
			"Admin, maintenance, and one-time errands with no creative arc. Neither grand enough for Finish nor small enough for Quick. These are things that just need dealing with — practical, unglamorous, necessary.",
		examples: [
			"Handle passport renewal",
			"Handle the car insurance renewal",
			"Handle the broken kitchen drawer",
			"Handle the Supabase billing issue",
			"Handle the visa application documents",
		],
		note: null,
	},
];

function TagGuideDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>How to Tag Your Tasks</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 pt-2 text-sm text-muted-foreground">
					<p>
						Tags aren&apos;t just labels — they tell you how to{" "}
						<em>approach</em> a task before you even start it. Each tag carries
						a different question:
					</p>

					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{[
							{ emoji: "🎯", q: "What does done look like?" },
							{ emoji: "🧭", q: "What will I learn?" },
							{ emoji: "⚡", q: "Can I knock this out now?" },
							{ emoji: "🔧", q: "Does this just need handling?" },
						].map(({ emoji, q }) => (
							<div
								key={emoji}
								className="bg-secondary rounded-lg px-3 py-2 text-center space-y-1"
							>
								<div className="text-lg">{emoji}</div>
								<p className="text-xs leading-snug">{q}</p>
							</div>
						))}
					</div>

					{TAG_GUIDE.map((tag) => (
						<div key={tag.label} className="space-y-2">
							<h4 className="text-foreground font-medium flex items-center gap-2">
								<span>{tag.emoji}</span>
								<span>{tag.label}</span>
							</h4>
							<p>{tag.description}</p>
							<ul className="space-y-1 ml-1">
								{tag.examples.map((example) => (
									<li key={example} className="flex items-start gap-2 text-xs">
										<span className="opacity-40 mt-0.5">—</span>
										<span className="italic">{example}</span>
									</li>
								))}
							</ul>
							{tag.note && (
								<p className="text-xs bg-secondary px-3 py-2 rounded">
									{tag.note}
								</p>
							)}
						</div>
					))}

					<div className="space-y-3 border-t border-border pt-4">
						<h4 className="text-foreground font-medium">
							How Tags Flow in Practice
						</h4>
						<p>A task often moves through types as it matures:</p>
						<div className="bg-secondary rounded-lg px-4 py-3 space-y-1 font-mono text-xs">
							<p>🧭 Explore content strategy direction</p>
							<p className="opacity-50 pl-4">↓ you emerge with clarity</p>
							<p>🎯 Finish the three-pillar content framework doc</p>
							<p className="opacity-50 pl-4">↓ along the way you need to</p>
							<p>⚡ Read the Wes Kao newsletter on positioning</p>
						</div>
					</div>

					<div className="space-y-2 border-t border-border pt-4">
						<h4 className="text-foreground font-medium">No tag?</h4>
						<p>
							That&apos;s fine too. Untagged tasks are honest — it means you
							haven&apos;t decided how to approach it yet. Use the{" "}
							<strong className="text-foreground">No 🏷️</strong> filter to
							surface them and tag in bulk when you&apos;re ready.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface TagPickerProps {
	currentTag: TagId | null;
	onSelectTag: (tag: TagId | null) => void;
	disabled?: boolean;
}

export function TagPicker({
	currentTag,
	onSelectTag,
	disabled,
}: TagPickerProps) {
	const [open, setOpen] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);

	const handleSelect = (tag: TagId | null) => {
		onSelectTag(tag);
		setOpen(false);
	};

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						disabled={disabled}
						className="h-8 w-8 p-0"
					>
						#
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-52 p-2" align="end">
					<div className="flex flex-col gap-1">
						{TAG_DEFINITIONS.map((tag) => (
							<button
								key={tag.id}
								onClick={() => handleSelect(tag.id)}
								className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-left"
							>
								<span>{tag.emoji}</span>
								<span>{tag.label}</span>
							</button>
						))}

						{currentTag && (
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

						<div className="border-t my-1" />
						<button
							onClick={() => {
								setGuideOpen(true);
							}}
							className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-left text-muted-foreground"
						>
							<Info className="w-3.5 h-3.5 flex-shrink-0" />
							<span>How to tag tasks</span>
						</button>
					</div>
				</PopoverContent>
			</Popover>

			<TagGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
		</>
	);
}
