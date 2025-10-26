import * as React from "react";
import { useStoredState } from "@/hooks/useStoredState";
import {
	AccountRole,
	getCurrentEmail,
	findAccount,
	getDisplayNameForAccount,
} from "@/utils/auth";
import { readFromStorage, writeToStorage } from "@/utils/storage";

export type NotificationCategory = "message" | "request" | "connection" | "system";

export interface AppNotification {
	id: string;
	message: string;
	createdAt: number;
	read: boolean;
	type: NotificationCategory;
	link?: string;
	contextId?: string | number;
}

const MAX_NOTIFICATIONS = 50;

function generateId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getNotificationKey(email: string, role: AccountRole) {
	const safeEmail = email || "guest";
	return `user:${safeEmail}:notifications:${role}`;
}

function sanitizeNotification(
	partial: Pick<AppNotification, "message"> &
		Partial<Omit<AppNotification, "message">>
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
		Partial<Omit<AppNotification, "message">> & { email?: string }
) {
	const email = input.email ?? getCurrentEmail() ?? "guest";
	const notification = sanitizeNotification(input);
	const key = getNotificationKey(email, role);
	const existing =
		readFromStorage<AppNotification[]>(key, [] as AppNotification[]) ?? [];

	const next = [notification, ...existing].slice(0, MAX_NOTIFICATIONS);
	writeToStorage(key, next);
	return notification;
}

export function pushNotificationToOtherRole(
	role: AccountRole,
	message: string,
	options?: Partial<Omit<AppNotification, "message">> & { email?: string }
) {
	return pushNotificationForRole(role, { message, ...options });
}

export function getDisplayNameForCurrentAccount() {
	const currentEmail = getCurrentEmail();
	if (!currentEmail) {
		return null;
	}
	const account = findAccount(currentEmail);
	return getDisplayNameForAccount(account) ?? currentEmail;
}

export function useNotifications(role: AccountRole) {
	const currentEmail = React.useMemo(
		() => getCurrentEmail() || (role === "mentor" ? "guest-mentor" : "guest"),
		[role]
	);

	const key = React.useMemo(
		() => getNotificationKey(currentEmail, role),
		[currentEmail, role]
	);

	const [notifications, setNotifications, clearNotifications] = useStoredState<
		AppNotification[]
	>(key, () => []);

	const sortedNotifications = React.useMemo(
		() =>
			[...notifications].sort(
				(a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
			),
		[notifications]
	);

	const unreadCount = React.useMemo(
		() => sortedNotifications.filter((notification) => !notification.read).length,
		[sortedNotifications]
	);

	const addNotification = React.useCallback(
		(
			input: Pick<AppNotification, "message"> &
				Partial<Omit<AppNotification, "message">>
		) => {
			setNotifications((prev) => {
				const notification = sanitizeNotification(input);
				const next = [notification, ...prev];
				return next.slice(0, MAX_NOTIFICATIONS);
			});
		},
		[setNotifications]
	);

	const markAllRead = React.useCallback(() => {
		setNotifications((prev) =>
			prev.map((notification) => ({ ...notification, read: true }))
		);
	}, [setNotifications]);

	const markAsRead = React.useCallback(
		(id: string) => {
			setNotifications((prev) =>
				prev.map((notification) =>
					notification.id === id ? { ...notification, read: true } : notification
				)
			);
		},
		[setNotifications]
	);

	const dismissNotification = React.useCallback(
		(id: string) => {
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== id)
			);
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
