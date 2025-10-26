import { readFromStorage, removeFromStorage, writeToStorage } from "@/utils/storage";
import { MentorMatch } from "./mentorMatching";

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
}

export interface AccountSettings {
	emailNotificationsEnabled?: boolean;
	requestAlerts?: boolean;
	digestWeekday?: string;
	digestTime?: string;
	digestEnabled?: boolean;
	availability?: boolean;
}

export interface StoredAccount {
	id: number;
	email: string;
	password: string;
	role: AccountRole;
	createdAt: string;
	profile: AccountProfile;
	settings: AccountSettings;
	wentThroughOnboarding?: boolean;
}

const ACCOUNTS_KEY = "auth:accounts";
const CURRENT_EMAIL_KEY = "auth:currentEmail";
const PENDING_EMAIL_KEY = "auth:pendingEmail";

function generateAccountId(): number {
	const timestampComponent = Date.now().toString(36);
	const randomComponent = Math.floor(Math.random() * 1_000_000)
		.toString(36)
		.padStart(4, "0");
	return Number.parseInt(`${timestampComponent}${randomComponent}`, 36);
}

export function getAccounts(): StoredAccount[] {
	const accounts = readFromStorage<StoredAccount[]>(ACCOUNTS_KEY, [] as StoredAccount[]);
	let needsPersist = false;
	const normalized = accounts.map((account) => {
		if (!account.id) {
			needsPersist = true;
			return { ...account, id: generateAccountId() } as StoredAccount;
		}
		return account;
	});
	if (needsPersist) {
		saveAccounts(normalized);
	}
	return normalized;
}

export function saveAccounts(accounts: StoredAccount[]) {
	writeToStorage(ACCOUNTS_KEY, accounts);
}

export function findAccount(email: string) {
	const normalized = email.trim().toLowerCase();
	return getAccounts().find((account) => account.email.toLowerCase() === normalized);
}

export function getDisplayNameForAccount(account?: StoredAccount | null) {
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
	createdAt?: string;
}): StoredAccount | null {
	const trimmedEmail = input.email.trim().toLowerCase();
	const accounts = getAccounts();
	const existingIndex = accounts.findIndex(
		(item) => item.email.toLowerCase() === trimmedEmail.toLowerCase()
	);

	if (existingIndex >= 0) {
		return null;
	}

	const account: StoredAccount = {
		id: generateAccountId(),
		email: trimmedEmail,
		password: input.password,
		role: input.role ?? "student",
		createdAt: input.createdAt ?? new Date().toISOString(),
		profile: {},
		settings: {},
		wentThroughOnboarding: false,
	};

	accounts.push(account);
	saveAccounts(accounts);
	setPendingEmail(account.email);
	return account;
}

export function authenticate(email: string, password: string) {
	const account = findAccount(email);
	if (!account) {
		return null;
	}

	if (account.password !== password) {
		return null;
	}

	writeToStorage(CURRENT_EMAIL_KEY, account.email.toLowerCase());
	return account;
}

export function logout() {
	removeFromStorage(CURRENT_EMAIL_KEY);
}

export function getCurrentEmail() {
	return readFromStorage<string>(CURRENT_EMAIL_KEY, "");
}

export function setCurrentEmail(email: string) {
	writeToStorage(CURRENT_EMAIL_KEY, email.trim().toLowerCase());
}

export function setPendingEmail(email: string) {
	writeToStorage(PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function getPendingEmail() {
	return readFromStorage<string>(PENDING_EMAIL_KEY, "");
}

export function clearPendingEmail() {
	removeFromStorage(PENDING_EMAIL_KEY);
}

export function updateAccount(email: string, updates: Partial<StoredAccount>) {
	const accounts = getAccounts();
	const idx = accounts.findIndex(
		(account) => account.email.toLowerCase() === email.toLowerCase()
	);
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

export function resetPassword(email: string, newPassword: string) {
	return updateAccount(email, { password: newPassword });
}
