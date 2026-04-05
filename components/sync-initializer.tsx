"use client";

import { useEffect } from "react";
import { startSyncListener } from "@/lib/sync";

export function SyncInitializer() {
	useEffect(() => {
		startSyncListener();
	}, []);

	return null;
}
