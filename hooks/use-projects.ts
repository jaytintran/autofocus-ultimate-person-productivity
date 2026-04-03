import useSWR from "swr";
import {
	getProjects,
	updateProject,
	addProject,
	deleteProject,
	type Project,
} from "@/lib/projects";
import { useCallback } from "react";
import { useUserId } from "./use-user-id";

export function useProjects() {
	const userId = useUserId();

	const {
		data: projects = [],
		mutate,
		isLoading,
	} = useSWR<Project[]>(userId ? `projects-${userId}` : null, getProjects, {
		refreshInterval: 0,
	});

	const handleUpdate = useCallback(
		async (id: string, updates: Partial<Project>) => {
			mutate(
				projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
				false,
			);
			await updateProject(id, updates);
			await mutate();
		},
		[projects, mutate],
	);

	const handleAdd = useCallback(
		async (project: Omit<Project, "id" | "created_at" | "updated_at">) => {
			await addProject(project);
			await mutate();
		},
		[mutate],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			mutate(
				projects.filter((p) => p.id !== id),
				false,
			);
			await deleteProject(id);
			await mutate();
		},
		[projects, mutate],
	);

	const handleStatusChange = useCallback(
		async (id: string, status: Project["status"]) => {
			await handleUpdate(id, { status });
		},
		[handleUpdate],
	);

	return {
		projects,
		isLoading,
		handleUpdate,
		handleAdd,
		handleDelete,
		handleStatusChange,
	};
}
