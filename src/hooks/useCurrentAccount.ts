import * as React from "react";
import { useStoredState } from "@/hooks/useStoredState";
import type { Account } from "@/utils/auth";

export function useCurrentAccount() {
	const [storedId] = useStoredState<number>("auth:currentId", () => 0);
	const [accounts] = useStoredState<Account[]>("auth:accounts", () => []);

	const account = React.useMemo(() => {
		if (!storedId) return null;
		return accounts.find((candidate) => candidate.id === storedId) ?? null;
	}, [accounts, storedId]);

	return {
		account,
		currentId: storedId || null,
		rawId: storedId || null,
	};
}
