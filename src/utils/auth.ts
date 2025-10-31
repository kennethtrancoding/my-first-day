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

export function findAccount(id: number, usePrecannedData = false, useRealData = true) {
	let data: Account;
	if (useRealData) {
		data = getAccounts().find((account) => account.id === id);
	}
	if (usePrecannedData) {
		data =
			students.find((account) => account.id === id) ||
			mentors.find((account) => account.id === id);
	}
	return data;
}
export function findAccountUsingEmail(email: string, usePrecannedData = false, useRealData = true) {
	let data: Account;
	if (useRealData) {
		data = getAccounts().find((account) => account.email === email);
		return data ?? undefined;
	}
	if (usePrecannedData) {
		data = students.find((account) => account.email === email);
		return data ?? mentors.find((account) => account.email === email);
	}
	return;
}
export function getDisplayNameForAccount(account?: Account | null) {
	if (!account) {
		return null;
	}

	const profile = account.profile ?? {};
	const first = profile.firstName?.trim();
	const last = profile.lastName?.trim();
	if (first && last) {
		return `${first} ${last}`;
	}

	return first ?? profile.displayName?.trim() ?? account.email;
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
	const account = findAccountUsingEmail(email);
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
