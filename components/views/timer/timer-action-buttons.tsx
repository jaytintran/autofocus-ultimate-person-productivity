"use client";

import {
	Pause,
	Play,
	Square,
	Check,
	RefreshCw,
	TimerReset,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { primaryBtn, secondaryBtn } from "./timer-bar.utils";

interface TimerActionButtonsProps {
	timerState: "idle" | "running" | "paused" | "stopped";
	effectiveWorkingTask: Task;
	isReentering: boolean;
	onStartTimer: () => void;
	onPause: () => void;
	onResume: () => void;
	onStop: () => void;
	onComplete: () => void;
	onReenter: () => void;
	onResetTime: () => void;
}

interface ButtonConfig {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
	variant: "primary" | "secondary";
	title?: string;
	disabled?: boolean;
	className?: string;
}

export function TimerActionButtons({
	timerState,
	effectiveWorkingTask,
	isReentering,
	onStartTimer,
	onPause,
	onResume,
	onStop,
	onComplete,
	onReenter,
	onResetTime,
}: TimerActionButtonsProps) {
	// Define button configurations for each state
	const buttonConfigs: Record<string, ButtonConfig[]> = {
		idle: [
			{
				icon: Play,
				label: "Start",
				onClick: onStartTimer,
				variant: "primary",
				title: "Start",
			},
			{
				icon: Check,
				label: "Complete",
				onClick: onComplete,
				variant: "secondary",
				title: "Complete",
				className: "text-[#8b9a6b]",
			},
			...(effectiveWorkingTask.total_time_ms > 0
				? [
						{
							icon: TimerReset,
							label: "Reset Timer",
							onClick: onResetTime,
							variant: "secondary" as const,
							title: "Reset time",
						},
					]
				: []),
		],
		running: [
			{
				icon: Pause,
				label: "Pause",
				onClick: onPause,
				variant: "secondary",
				title: "Pause",
			},
			{
				icon: Square,
				label: "Stop",
				onClick: onStop,
				variant: "secondary",
				title: "Stop",
			},
			{
				icon: Check,
				label: "Complete",
				onClick: onComplete,
				variant: "primary",
				title: "Complete",
			},
			...(effectiveWorkingTask.total_time_ms > 0
				? [
						{
							icon: TimerReset,
							label: "Reset Timer",
							onClick: onResetTime,
							variant: "secondary" as const,
							title: "Reset time",
						},
					]
				: []),
		],
		paused: [
			{
				icon: Play,
				label: "Resume",
				onClick: onResume,
				variant: "primary",
				title: "Resume",
			},
			{
				icon: Square,
				label: "Stop",
				onClick: onStop,
				variant: "secondary",
				title: "Stop",
			},
			{
				icon: Check,
				label: "Complete",
				onClick: onComplete,
				variant: "secondary",
				title: "Complete",
				className: "text-[#8b9a6b]",
			},
			...(effectiveWorkingTask.total_time_ms > 0
				? [
						{
							icon: TimerReset,
							label: "Reset Timer",
							onClick: onResetTime,
							variant: "secondary" as const,
							title: "Reset time",
						},
					]
				: []),
		],
		stopped: [
			{
				icon: Play,
				label: "Resume",
				onClick: onStartTimer,
				variant: "secondary",
				title: "Resume",
			},
			{
				icon: Check,
				label: "Complete",
				onClick: onComplete,
				variant: "primary",
				title: "Complete",
			},
			{
				icon: RefreshCw,
				label: "Re-enter",
				onClick: onReenter,
				variant: "secondary",
				title: "Re-enter",
				disabled: isReentering,
				className: isReentering ? "animate-spin" : "",
			},
			...(effectiveWorkingTask.total_time_ms > 0
				? [
						{
							icon: TimerReset,
							label: "Reset Timer",
							onClick: onResetTime,
							variant: "secondary" as const,
							title: "Reset time",
						},
					]
				: []),
		],
	};

	const buttons = buttonConfigs[timerState] || [];

	return (
		<div className="flex items-center gap-1.5">
			{buttons.map((btn, index) => {
				const Icon = btn.icon;
				const btnClass = btn.variant === "primary" ? primaryBtn : secondaryBtn;

				return (
					<div key={index}>
						{/* Mobile: icon only */}
						<button
							onClick={btn.onClick}
							className={`${btnClass} md:hidden`}
							title={btn.title}
							disabled={btn.disabled}
						>
							<Icon className={`h-4 w-4 ${btn.className || ""}`} />
						</button>
						{/* Desktop: icon + text */}
						<button
							onClick={btn.onClick}
							className={`${btnClass} hidden md:inline-flex`}
							title={btn.title}
							disabled={btn.disabled}
						>
							<Icon className={`h-3.5 w-3.5 ${btn.className || ""}`} />
							{btn.label}
						</button>
					</div>
				);
			})}
		</div>
	);
}
