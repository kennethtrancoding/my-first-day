export type Initializer<T> = T | (() => T);

export const STORAGE_PREFIX = "cac-app:";

export function resolveInitializer<T>(initialValue: Initializer<T>): T {
	return typeof initialValue === "function"
		? (initialValue as () => T)()
		: (initialValue as T);
}

export function storageKey(key: string) {
	return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

export function readFromStorage<T>(key: string, initialValue: Initializer<T>): T {
	if (typeof window === "undefined") {
		return resolveInitializer(initialValue);
	}

	try {
		const raw = window.localStorage.getItem(storageKey(key));
		if (raw == null) {
			return resolveInitializer(initialValue);
		}

		return JSON.parse(raw) as T;
	} catch (error) {
		console.warn(`Failed to read localStorage key "${key}":`, error);
		return resolveInitializer(initialValue);
	}
}

export function writeToStorage<T>(key: string, value: T) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(storageKey(key), JSON.stringify(value));
	} catch (error) {
		console.warn(`Failed to write localStorage key "${key}":`, error);
	}
}

export function removeFromStorage(key: string) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.removeItem(storageKey(key));
	} catch (error) {
		console.warn(`Failed to remove localStorage key "${key}":`, error);
	}
}
