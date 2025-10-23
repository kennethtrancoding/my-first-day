import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Initializer,
	readFromStorage,
	removeFromStorage,
	resolveInitializer,
	storageKey,
	writeToStorage,
} from "@/utils/storage";

export function useStoredState<T>(
	key: string,
	initialValue: Initializer<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	const resolvedKey = useMemo(() => storageKey(key), [key]);
	const initialRef = useRef(initialValue);

	const [state, setState] = useState<T>(() => readFromStorage<T>(key, initialRef.current));

	useEffect(() => {
		setState(readFromStorage(key, initialRef.current));
	}, [key]);

	const setStoredState = useCallback(
		(next: T | ((prev: T) => T)) => {
			setState((prev) => {
				const resolvedNext =
					typeof next === "function" ? (next as (p: T) => T)(prev) : next;

				writeToStorage(key, resolvedNext);

				return resolvedNext;
			});
		},
		[key]
	);

	const clearState = useCallback(() => {
		removeFromStorage(key);
		setState(resolveInitializer(initialRef.current));
	}, [key]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		function handleStorage(event: StorageEvent) {
			if (event.storageArea !== window.localStorage) return;
			if (event.key !== resolvedKey) return;

			setState(readFromStorage(key, initialRef.current));
		}

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [key, resolvedKey]);

	return [state, setStoredState, clearState];
}
