import * as React from "react";
import { useStoredState } from "@/hooks/useStoredState";
import { AccountRole, getCurrentId, getDisplayNameForAccount } from "@/utils/auth";
import { readFromStorage, writeToStorage } from "@/utils/storage";

export type NotificationCategory = "message" | "request" | "connection" | "system";

export interface AppNotification {
	id: number;
	message: string;
	createdAt: number;
	read: boolean;
	type: NotificationCategory;
	link?: string;
	contextId?: string | number;
}

const MAX_NOTIFICATIONS = 50;

function generateId() {
	return parseInt(`${Date.now()}${Math.random().toString(36).slice(2, 10)}`);
}

function getNotificationKey(accountId: number, role: AccountRole) {
	const safeId = Number.isFinite(accountId) ? accountId : 0;
	return `user:${safeId}:notifications:${role}`;
}

function sanitizeNotification(
	partial: Pick<AppNotification, "message"> & Partial<Omit<AppNotification, "message">>
): AppNotification {
	return {
		id: partial.id ?? generateId(),
		message: partial.message,
		createdAt: partial.createdAt ?? Date.now(),
		read: partial.read ?? false,
		type: partial.type ?? "system",
		link: partial.link,
		contextId: partial.contextId,
	};
}

export function pushNotificationForRole(
	role: AccountRole,
	input: Pick<AppNotification, "message"> &
		Partial<Omit<AppNotification, "message">> & {
			recipientId?: number;
		}
) {
	const targetAccountId = input.recipientId ?? getCurrentId() ?? 0;
	const notification = sanitizeNotification(input);
	const key = getNotificationKey(targetAccountId, role);
	const existing = readFromStorage<AppNotification[]>(key, [] as AppNotification[]) ?? [];
	const next = [notification, ...existing].slice(0, MAX_NOTIFICATIONS);
	writeToStorage(key, next);
	return notification;
}

export function pushNotificationToOtherRole(
	role: AccountRole,
	message: string,
	options?: Partial<Omit<AppNotification, "message">> & {
		recipientId?: number;
	}
) {
	return pushNotificationForRole(role, { message, ...options });
}

export function getDisplayNameForCurrentAccount() {
	const currentId = getCurrentId();
	if (!currentId) return null;

	type Account = {
		id: number;
		email: string;
		profile?: Record<string, unknown>;
	};
	const accounts = readFromStorage<Account[]>("auth:accounts", [] as Account[]);
	const account = accounts.find((a) => a.id === currentId) ?? null;

	if (!account) {
		return String(currentId);
	}

	const name = getDisplayNameForAccount({ email: account.email, profile: account.profile ?? {} });
	return name || account.email || String(currentId);
}

export function useNotifications(role: AccountRole) {
	const currentId = React.useMemo(() => getCurrentId() ?? 0, []);

	const key = React.useMemo(() => getNotificationKey(currentId, role), [currentId, role]);

	const [notifications, setNotifications, clearNotifications] = useStoredState<AppNotification[]>(
		key,
		() => []
	);

	const sortedNotifications = React.useMemo(
		() => [...notifications].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
		[notifications]
	);

	const unreadCount = React.useMemo(
		() => sortedNotifications.filter((n) => !n.read).length,
		[sortedNotifications]
	);

	const addNotification = React.useCallback(
		(input: Pick<AppNotification, "message"> & Partial<Omit<AppNotification, "message">>) => {
			setNotifications((prev) => {
				const notification = sanitizeNotification(input);
				const next = [notification, ...prev];
				return next.slice(0, MAX_NOTIFICATIONS);
			});
		},
		[setNotifications]
	);

	const markAllRead = React.useCallback(() => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	}, [setNotifications]);

	const markAsRead = React.useCallback(
		(id: number) => {
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
		},
		[setNotifications]
	);

	const dismissNotification = React.useCallback(
		(id: number) => {
			setNotifications((prev) => prev.filter((n) => n.id !== id));
		},
		[setNotifications]
	);

	return {
		notifications: sortedNotifications,
		unreadCount,
		addNotification,
		markAllRead,
		markAsRead,
		dismissNotification,
		clearNotifications,
	};
}
