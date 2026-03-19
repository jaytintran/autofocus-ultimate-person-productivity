"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export function AboutSection() {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("philosophy");
	const isMobile = useIsMobile();

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="p-2 hover:bg-accent rounded transition-colors"
				aria-label="About Autofocus"
				title="About Autofocus (AF4)"
			>
				<Info className="w-4 h-4" />
			</button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>About Autofocus (AF4)</DialogTitle>
						<DialogDescription>
							Learn about the Autofocus productivity system and how to use it
							effectively.
						</DialogDescription>
					</DialogHeader>

					<Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4">
						{isMobile ? (
							<Select value={activeTab} onValueChange={setActiveTab}>
								<SelectTrigger className="w-full mb-4">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="philosophy">The Philosophy</SelectItem>
									<SelectItem value="how">How It Works</SelectItem>
									<SelectItem value="steps">The Steps</SelectItem>
									<SelectItem value="dismissal">Why No Dismissal</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<TabsList className="w-full grid grid-cols-4">
								<TabsTrigger value="philosophy" className="flex-1">
									The Philosophy
								</TabsTrigger>
								<TabsTrigger value="how" className="flex-1">
									How It Works
								</TabsTrigger>
								<TabsTrigger value="steps" className="flex-1">
									The Steps
								</TabsTrigger>
								<TabsTrigger value="dismissal" className="flex-1">
									Why No Dismissal
								</TabsTrigger>
							</TabsList>
						)}

						<TabsContent
							value="philosophy"
							className="text-sm text-muted-foreground space-y-4 mt-4"
						>
							<p>
								Most productivity systems fail because they rely entirely on
								your rational mind to decide what to do next. You make a
								prioritized list, you follow it top to bottom, and you ignore
								the fact that your brain doesn't actually work that way. The
								result is resistance, procrastination, and a nagging sense that
								you're working on the wrong things.
							</p>
							<p>
								Autofocus is different. It works by balancing two parts of your
								mind — the rational and the intuitive. Your rational mind
								captures everything (the list). Your intuitive mind decides
								what's ready to be done (the "standing out" feeling). Neither
								part runs the show alone. Together, they produce decisions that
								feel right and actually get executed.
							</p>
							<p>
								The result: less friction, less stress, more output, and a focus
								that feels genuinely aligned with what matters — not just what
								looks urgent on paper.
							</p>
							<div>
								<h4 className="text-foreground font-medium mb-2">
									Key principles:
								</h4>
								<ul className="list-disc list-inside space-y-1.5 ml-2">
									<li>
										<strong>Trust your intuition</strong> — Don&apos;t force
										priorities; let tasks naturally rise
									</li>
									<li>
										<strong>No pressure</strong> — Work on what feels right, not
										what seems urgent
									</li>
									<li>
										<strong>Keep moving</strong> — If nothing stands out, move
										to the next page
									</li>
									<li>
										<strong>Re-enter freely</strong> — Incomplete tasks get
										another chance at the end
									</li>
								</ul>
							</div>
						</TabsContent>

						<TabsContent
							value="how"
							className="text-sm text-muted-foreground space-y-4 mt-4"
						>
							<p>
								Add tasks to the list as they come to mind — no sorting, no
								ranking. New tasks always go at the end.
							</p>
							<p>
								Work through the list page by page. On each page, read through
								the tasks and wait for one to stand out — to feel ready,
								interesting, or simply right. That's the one you work on. Click
								it, start the timer, and go.
							</p>
							<p>
								When you're done with a task (or ready to move on), mark it
								complete, re-enter it at the end of the list, or delete it. Then
								look at the page again and see what stands out next. Repeat
								until nothing is calling to you, then move to the next page.
							</p>
							<p>
								Trust the process. If a task keeps being skipped, that's
								information — either break it down into something smaller, or
								delete it honestly.
							</p>
						</TabsContent>

						<TabsContent
							value="steps"
							className="text-sm text-muted-foreground space-y-4 mt-4"
						>
							<ol className="list-decimal list-inside space-y-1.5 ml-2">
								<li>Write down everything you need to do in one long list</li>
								<li>Work through the list page by page</li>
								<li>
									On each page, scan the tasks and ask yourself:{" "}
									<em className="text-af4-warn">
										&quot;What do I want to do?&quot;
									</em>
								</li>
								<li>
									When a task stands out, work on it until you want to stop
								</li>
								<li>
									If the task is done, cross it off. If not, re-enter it at the
									end of the list
								</li>
								<li>Continue scanning from where you left off</li>
								<li>
									When you reach the end of the page with no task standing out,
									move to the next page
								</li>
							</ol>
						</TabsContent>

						<TabsContent
							value="dismissal"
							className="text-sm text-muted-foreground space-y-4 mt-4"
						>
							<h4 className="text-foreground font-medium">
								Why Dismissal Was Removed
							</h4>
							<p>
								The original Autofocus system included a "dismissal" mechanic:
								if you cycled through an entire page without any task standing
								out, all remaining tasks on that page were permanently retired —
								greyed out, not re-entered, gone.
							</p>
							<p>
								This mechanic made sense for its original medium: a paper
								notebook. On paper, you can't delete a task. Dismissal was the
								only way to formally retire something that had stopped being
								relevant. It was the system's self-cleaning mechanism.
							</p>
							<p>
								This app has a delete button. The problem dismissal was designed
								to solve doesn't exist here.
							</p>
							<p>
								Beyond that, dismissal added cognitive overhead — you had to
								track whether you'd completed a "full pass," remember not to
								advance pages too early, and manage a third visual state
								(greyed-out dismissed tasks) cluttering the list. All of that
								friction for a mechanic that most people worked around anyway.
							</p>
							<div>
								<h4 className="text-foreground font-medium mb-2">
									How to handle tasks you're avoiding, now:
								</h4>
								<ul className="list-disc list-inside space-y-1.5 ml-2">
									<li>
										If a task is no longer relevant — <strong>delete it</strong>
										. It's gone, it won't come back, no ambiguity.
									</li>
									<li>
										If a task still matters but isn't ready yet —{" "}
										<strong>re-enter it</strong>. It moves to the end of the
										list and comes back around naturally.
									</li>
									<li>
										If a task keeps getting re-entered and never gets done —
										that's a signal worth paying attention to. Either break it
										down into something smaller, or delete it honestly.
									</li>
								</ul>
							</div>
							<p>
								This approach puts the decision consciously in your hands rather
								than delegating it to a page-cycling rule. It's more direct, and
								for how most people actually use a digital task list, it's more
								honest.
							</p>
						</TabsContent>
					</Tabs>

					<p className="text-xs border-t border-border pt-4 mt-4 text-muted-foreground">
						Learn more at{" "}
						<a
							href="http://markforster.squarespace.com/autofocus-system/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-af4-olive hover:underline"
						>
							Mark Forster&apos;s website
						</a>
					</p>
				</DialogContent>
			</Dialog>
		</>
	);
}
