import useSWR from "swr";
import {
	getBooks,
	updateBook,
	addBook,
	deleteBook,
	type Book,
} from "@/lib/books";
import { useCallback } from "react";
import { useUserId } from "./use-user-id";

export function useBooks() {
	const userId = useUserId();

	const {
		data: books = [],
		mutate,
		isLoading,
	} = useSWR<Book[]>(userId ? `books-${userId}` : null, getBooks, {
		refreshInterval: 0,
	});
	const handleUpdate = useCallback(
		async (id: string, updates: Partial<Book>) => {
			// Optimistic
			mutate(
				books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
				false,
			);
			await updateBook(id, updates);
			await mutate();
		},
		[books, mutate],
	);

	const handleAdd = useCallback(
		async (book: Omit<Book, "id" | "created_at" | "updated_at">) => {
			await addBook(book);
			await mutate();
		},
		[mutate],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			mutate(
				books.filter((b) => b.id !== id),
				false,
			);
			await deleteBook(id);
			await mutate();
		},
		[books, mutate],
	);

	const handleStatusChange = useCallback(
		async (id: string, status: Book["status"]) => {
			const now = new Date().toISOString();
			const updates: Partial<Book> = { status };
			if (status === "reading") updates.started_at = now;
			if (status === "completed") updates.finished_at = now;
			await handleUpdate(id, updates);
		},
		[handleUpdate],
	);

	return {
		books,
		isLoading,
		handleUpdate,
		handleAdd,
		handleDelete,
		handleStatusChange,
	};
}
