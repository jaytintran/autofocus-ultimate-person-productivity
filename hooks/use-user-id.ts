import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUserId(): string | null {
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			setUserId(data.user?.id ?? null);
		});
	}, []);

	return userId;
}
