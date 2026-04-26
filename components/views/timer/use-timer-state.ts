import { useState, useEffect, useRef, useCallback } from "react";
import type { Task, AppState } from "@/lib/types";

type OptimisticTimer = "idle" | "running" | "paused" | "stopped" | null;

interface UseTimerStateProps {
	workingTask: Task | null;
	appState: AppState;
	onStartTimer: () => Promise<void>;
	onPauseTimer: (sessionMs: number) => Promise<void>;
	onResumeTimer: () => Promise<void>;
	onStopTimer: (task: Task, sessionMs: number) => Promise<void>;
}

export function useTimerState({
	workingTask,
	appState,
	onStartTimer,
	onPauseTimer,
	onResumeTimer,
	onStopTimer,
}: UseTimerStateProps) {
	// ── Optimistic working task state ──────────────────────────────────────────
	const [optimisticWorkingTask, setOptimisticWorkingTask] = useState<
		Task | null | undefined
	>(undefined);

	// Derive effective working task: optimistic overrides prop
	const effectiveWorkingTask =
		optimisticWorkingTask !== undefined ? optimisticWorkingTask : workingTask;

	// Clear optimistic state when real workingTask catches up
	useEffect(() => {
		if (optimisticWorkingTask !== undefined) {
			if (
				workingTask === null ||
				(optimisticWorkingTask === null && workingTask === null)
			) {
				setOptimisticWorkingTask(undefined);
			}
		}
	}, [workingTask, optimisticWorkingTask]);

	// ── Optimistic timer state ─────────────────────────────────────────────────
	const [optimisticTimerState, setOptimisticTimerState] =
		useState<OptimisticTimer>(null);

	// Clear optimistic state when real appState catches up
	useEffect(() => {
		setOptimisticTimerState(null);
	}, [appState.timer_state]);

	const timerState = optimisticTimerState ?? appState.timer_state;
	const isIdle = timerState === "idle";
	const isRunning = timerState === "running";
	const isPaused = timerState === "paused";
	const isStopped = timerState === "stopped";

	// ── Session timer ──────────────────────────────────────────────────────────
	const [sessionMs, setSessionMs] = useState(0);
	const sessionStartRef = useRef<number | null>(null);
	const baseSessionMsRef = useRef(0);

	useEffect(() => {
		if (!effectiveWorkingTask) {
			setSessionMs(0);
			sessionStartRef.current = null;
			baseSessionMsRef.current = 0;
			return;
		}

		if (appState.timer_state === "running") {
			const startTime = appState.session_start_time
				? new Date(appState.session_start_time).getTime()
				: Date.now();
			sessionStartRef.current = startTime;
			baseSessionMsRef.current = appState.current_session_ms;

			const interval = setInterval(() => {
				setSessionMs(
					baseSessionMsRef.current + (Date.now() - sessionStartRef.current!),
				);
			}, 1000);
			return () => clearInterval(interval);
		} else if (appState.timer_state === "paused") {
			setSessionMs(appState.current_session_ms);
		} else {
			setSessionMs(0);
		}
	}, [
		effectiveWorkingTask,
		appState.timer_state,
		appState.session_start_time,
		appState.current_session_ms,
	]);

	// ── Handlers ───────────────────────────────────────────────────────────────

	const handleStartTimer = useCallback(async () => {
		setOptimisticTimerState("running");
		try {
			await onStartTimer();
		} catch {
			setOptimisticTimerState(null);
		}
	}, [onStartTimer]);

	const handlePause = useCallback(async () => {
		setOptimisticTimerState("paused");
		try {
			await onPauseTimer(sessionMs);
		} catch {
			setOptimisticTimerState(null);
		}
	}, [sessionMs, onPauseTimer]);

	const handleResume = useCallback(async () => {
		setOptimisticTimerState("running");
		try {
			await onResumeTimer();
		} catch {
			setOptimisticTimerState(null);
		}
	}, [onResumeTimer]);

	const handleStop = useCallback(async () => {
		if (!effectiveWorkingTask) return;
		setOptimisticTimerState("stopped");
		try {
			await onStopTimer(effectiveWorkingTask, sessionMs);
		} catch {
			setOptimisticTimerState(null);
		}
	}, [effectiveWorkingTask, sessionMs, onStopTimer]);

	return {
		effectiveWorkingTask,
		setOptimisticWorkingTask,
		timerState,
		isIdle,
		isRunning,
		isPaused,
		isStopped,
		sessionMs,
		handleStartTimer,
		handlePause,
		handleResume,
		handleStop,
	};
}
