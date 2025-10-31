import { readFromStorage, removeFromStorage, writeToStorage } from "@/utils/storage";
import { MentorMatch } from "./mentorMatching";
import { ConversationRequest, ConversationThread } from "./messaging";
import { mentors, students } from "./people";

export type AccountRole = "student" | "mentor";

export interface AccountProfile {
	displayName?: string;
	firstName?: string;
	lastName?: string;
	grade?: string;
	interests?: string[];
	schedule?: string[];
	clothingSize?: string;
	bio?: string;
	matchedMentorIds?: MentorMatch[];
	mentorBio?: string;
	mentorOfficeHours?: string;
	mentorType?: "teacher" | "student";
	teacherTitle?: string;
	teacherRoom?: string;
	teacherDepartment?: string;
	teacherAvailabilityNotes?: string;
}

export interface AccountSettings {
	emailNotificationsEnabled?: boolean;
	pushNotificationsEnabled?: boolean;
	requestAlerts?: boolean;
	digestWeekday?: string;
	digestTime?: string;
	digestEnabled?: boolean;
	availability?: boolean;
	resourceRemindersEnabled?: boolean;
	mapAlertsEnabled?: boolean;
	smsUrgentAlertsEnabled?: boolean;
}

export interface Account {
	id: number;
	email: string;
	password: string;
	role: AccountRole;
	createdAt: number;
	profile: AccountProfile;
	settings: AccountSettings;
	wentThroughOnboarding?: boolean;
	outgoingMessageRequests?: ConversationRequest[] | [];
	messageThreads?: ConversationThread[] | [];
}
export function getDisplayNameForAccount(
	account?: Pick<Account, "email" | "profile"> | null
): string {
	if (!account) {
		return "";
	}

	const profile = account.profile ?? {};
	const first = profile.firstName?.trim();
	const last = profile.lastName?.trim();
	if (first && last) {
		return `${first} ${last}`;
	}
	if (first) {
		return first;
	}

	const displayName = profile.displayName?.trim();
	if (displayName) {
		return displayName;
	}

	return account.email ?? "";
}
export interface AccountFilter {
	useRealData?: boolean;
	usePrecannedData?: boolean;

	q?: string;
	role?: AccountRole | AccountRole[];
	ids?: number[];
	email?: string | string[];
	createdAfter?: number;
	createdBefore?: number;

	mentorType?: "teacher" | "student";
	hasMatchedMentors?: boolean;

	availability?: boolean;
	digestEnabled?: boolean;
	emailNotificationsEnabled?: boolean;
	pushNotificationsEnabled?: boolean;

	wentThroughOnboarding?: boolean;

	sortBy?: "createdAt" | "email" | "displayName";
	sortDir?: "asc" | "desc";
	offset?: number;
	limit?: number;
}

const ACCOUNTS_KEY = "auth:accounts";
const CURRENT_ID_KEY = "auth:currentId";
const PENDING_ID_KEY = "auth:pendingId";

function generateAccountId(): number {
	const timestampComponent = Date.now().toString(36);
	const randomComponent = Math.floor(Math.random() * 1_000_000)
		.toString(36)
		.padStart(4, "0");
	return Number.parseInt(`${timestampComponent}${randomComponent}`, 36);
}

export function getAccounts(): Account[] {
	const accounts = readFromStorage<Account[]>(ACCOUNTS_KEY, [] as Account[]);
	let needsPersist = false;
	const normalized = accounts.map((account) => {
		if (!account.id) {
			needsPersist = true;
			return { ...account, id: generateAccountId() } as Account;
		}
		return account;
	});
	if (needsPersist) {
		saveAccounts(normalized);
	}
	return normalized;
}

export function saveAccounts(accounts: Account[]) {
	writeToStorage(ACCOUNTS_KEY, accounts);
}
export function registerAccount(input: {
	email: string;
	password: string;
	role?: AccountRole;
	createdAt?: number;
}): Account | null {
	const trimmedEmail = input.email.trim().toLowerCase();
	const accounts = getAccounts();
	const existingIndex = accounts.findIndex(
		(item) => item.email.toLowerCase() === trimmedEmail.toLowerCase()
	);

	if (existingIndex >= 0) {
		return null;
	}

	const account: Account = {
		id: generateAccountId(),
		email: trimmedEmail,
		password: input.password,
		role: input.role ?? "student",
		createdAt: input.createdAt ?? Date.now(),
		profile: {},
		settings: {},
		wentThroughOnboarding: false,
		outgoingMessageRequests: [],
		messageThreads: [],
	};

	accounts.push(account);
	saveAccounts(accounts);
	setPendingId(account.id);
	return account;
}

export function authenticate(email: string, password: string) {
	const account = findAccounts({
		email,
	})[0];
	if (!account) return null;
	if (account.password !== password) return null;

	writeToStorage(CURRENT_ID_KEY, account.id);
	return account;
}

export function logout() {
	removeFromStorage(CURRENT_ID_KEY);
}

export function getCurrentId() {
	return readFromStorage<number>(CURRENT_ID_KEY, null);
}

export function setCurrentId(id: number) {
	writeToStorage(CURRENT_ID_KEY, id);
}
export function setPendingId(id: number) {
	writeToStorage(PENDING_ID_KEY, id);
}

export function getPendingId() {
	return readFromStorage<number>(PENDING_ID_KEY, null);
}

export function clearPendingId() {
	removeFromStorage(PENDING_ID_KEY);
}

export function updateAccount(id: number, updates: Partial<Account>) {
	const accounts = getAccounts();
	const idx = accounts.findIndex((account) => account.id === id);
	if (idx === -1) {
		return null;
	}

	const nextAccount = { ...accounts[idx], ...updates };
	if (updates.profile) {
		nextAccount.profile = {
			...accounts[idx].profile,
			...updates.profile,
		};
	}
	if (updates.settings) {
		nextAccount.settings = {
			...accounts[idx].settings,
			...updates.settings,
		};
	}
	accounts[idx] = nextAccount;
	saveAccounts(accounts);
	return nextAccount;
}

export function updateAccountEmail(accountId: number, newEmail: string) {
	const normalizedNew = newEmail.trim().toLowerCase();

	if (!normalizedNew) {
		return { success: false, error: "Please provide a valid email." };
	}

	const accounts = getAccounts();
	const idx = accounts.findIndex((account) => account.id === accountId);

	if (idx === -1) {
		return { success: false, error: "We couldn't find that account." };
	}

	const conflictIndex = accounts.findIndex(
		(account, accountIdx) => accountIdx !== idx && account.email.toLowerCase() === normalizedNew
	);

	if (conflictIndex !== -1) {
		return { success: false, error: "That email is already in use." };
	}

	accounts[idx] = {
		...accounts[idx],
		email: normalizedNew,
	};
	saveAccounts(accounts);

	const activeId = getCurrentId();
	if (activeId) {
		setCurrentId(activeId);
	}

	const pending = getPendingId();
	if (pending) {
		setPendingId(pending);
	}

	return { success: true, email: normalizedNew };
}

export function resetPassword(id: number, newPassword: string) {
	return updateAccount(id, { password: newPassword });
}

export function findAccounts(filter: AccountFilter = {}): Account[] {
	const fromReal = filter.useRealData !== false ? getAccounts() : [];
	const fromPrecanned = filter.usePrecannedData ? [...students, ...mentors] : [];

	const byId = new Map<number, Account>();
	for (const acc of [...fromPrecanned, ...fromReal]) {
		if (!byId.has(acc.id)) byId.set(acc.id, acc);
	}
	let list = Array.from(byId.values());

	const toLower = (s?: string | null) => (s ?? "").toLowerCase();
	const roles: AccountRole[] = Array.isArray(filter.role)
		? filter.role
		: filter.role
		? [filter.role]
		: [];

	const emailSet =
		typeof filter.email === "string"
			? new Set([toLower(filter.email)])
			: Array.isArray(filter.email)
			? new Set(filter.email.map(toLower))
			: null;

	const idSet = Array.isArray(filter.ids) ? new Set(filter.ids) : null;

	list = list.filter((acc) => {
		if (idSet && !idSet.has(acc.id)) return false;

		if (emailSet && !emailSet.has(toLower(acc.email))) return false;

		if (roles.length && !roles.includes(acc.role)) return false;

		if (typeof filter.createdAfter === "number" && acc.createdAt < filter.createdAfter)
			return false;
		if (typeof filter.createdBefore === "number" && acc.createdAt > filter.createdBefore)
			return false;

		if (
			typeof filter.wentThroughOnboarding === "boolean" &&
			(acc.wentThroughOnboarding ?? false) !== filter.wentThroughOnboarding
		)
			return false;

		const p = acc.profile ?? {};
		if (filter.mentorType && p.mentorType !== filter.mentorType) return false;
		if (typeof filter.hasMatchedMentors === "boolean") {
			const has = !!(p.matchedMentorIds && p.matchedMentorIds.length > 0);
			if (has !== filter.hasMatchedMentors) return false;
		}

		const s = acc.settings ?? {};
		if (
			typeof filter.availability === "boolean" &&
			(s.availability ?? false) !== filter.availability
		)
			return false;
		if (
			typeof filter.digestEnabled === "boolean" &&
			(s.digestEnabled ?? false) !== filter.digestEnabled
		)
			return false;
		if (
			typeof filter.emailNotificationsEnabled === "boolean" &&
			(s.emailNotificationsEnabled ?? false) !== filter.emailNotificationsEnabled
		)
			return false;
		if (
			typeof filter.pushNotificationsEnabled === "boolean" &&
			(s.pushNotificationsEnabled ?? false) !== filter.pushNotificationsEnabled
		)
			return false;

		if (filter.q) {
			const needle = toLower(filter.q);
			const displayName = acc.profile?.displayName ?? "";
			const profileFirst = toLower(acc.profile?.firstName);
			const profileLast = toLower(acc.profile?.lastName);
			const haystack = [
				toLower(acc.email),
				toLower(displayName),
				profileFirst,
				profileLast,
			].join(" ");
			if (!haystack.includes(needle)) return false;
		}

		return true;
	});

	if (filter.sortBy) {
		const dir = filter.sortDir === "desc" ? -1 : 1;
		const cmpStr = (a?: string | null, b?: string | null) =>
			toLower(a).localeCompare(toLower(b));
		list.sort((a, b) => {
			switch (filter.sortBy) {
				case "createdAt":
					return (a.createdAt - b.createdAt) * dir;
				case "email":
					return cmpStr(a.email, b.email) * dir;
				case "displayName":
					return cmpStr(a.profile?.displayName, b.profile?.displayName) * dir;
				default:
					return 0;
			}
		});
	}

	const start = Math.max(0, filter.offset ?? 0);
	const end = typeof filter.limit === "number" ? start + Math.max(0, filter.limit) : undefined;
	return list.slice(start, end);
}
