import * as React from "react";
import { useStoredState } from "@/hooks/useStoredState";
import type { StoredAccount } from "@/utils/auth";

function normalizeEmail(input?: string | null) {
	if (!input) {
		return "";
	}
	return input.trim().toLowerCase();
}

export function useCurrentAccount() {
	const [storedEmail] = useStoredState<string>("auth:currentEmail", () => "");
	const [accounts] = useStoredState<StoredAccount[]>("auth:accounts", () => []);

	const normalizedEmail = React.useMemo(() => normalizeEmail(storedEmail), [storedEmail]);

	const account = React.useMemo(() => {
		if (!normalizedEmail) {
			return null;
		}
		return (
			accounts.find((candidate) => candidate.email.toLowerCase() === normalizedEmail) ?? null
		);
	}, [accounts, normalizedEmail]);

	return {
		account,
		currentEmail: normalizedEmail || null,
		rawEmail: storedEmail || null,
	};
}
