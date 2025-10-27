import { Message } from "@/utils/people";

export const CONVERSATION_STORE_KEY = "messages:threads";
export const CONVERSATION_REQUESTS_KEY = "messages:requests";
const THREAD_ID_MOD = 100_000;
const THREAD_ID_OFFSETS = {
	mentor: 200_000,
	student: 400_000,
} as const;

export interface ConversationMessage {
	id: number;
	from: string;
	text: string;
	timestamp: number;
}

export interface ConversationThread {
	participants: [string, string];
	messages: ConversationMessage[];
	lastMessageUnix?: number;
}

export type ConversationStore = Record<string, ConversationThread>;
export type ConversationRequestDirection = "student_to_mentor" | "mentor_to_student";

export interface ConversationRequest {
	key: string;
	initiator: string;
	recipient: string;
	direction: ConversationRequestDirection;
	createdAt: number;
}

export type ConversationRequestStore = Record<string, ConversationRequest>;

export function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export function getConversationKey(a: string, b: string) {
	const [first, second] = [normalizeEmail(a), normalizeEmail(b)].sort();
	return `${first}__${second}`;
}

function withThreadParticipants(sender: string, recipient: string): [string, string] {
	const participants = [sender, recipient].sort();
	return [participants[0], participants[1]];
}

export function appendConversationMessage(
	store: ConversationStore,
	params: { from: string; to: string; text: string }
): ConversationStore {
	const sender = normalizeEmail(params.from);
	const recipient = normalizeEmail(params.to);
	const key = getConversationKey(sender, recipient);
	const timestamp = Date.now();
	const nextMessage: ConversationMessage = {
		id: timestamp,
		from: sender,
		text: params.text,
		timestamp,
	};

	const existing = store[key];
	const participants = existing?.participants ?? withThreadParticipants(sender, recipient);
	const messages = existing ? [...existing.messages, nextMessage] : [nextMessage];

	return {
		...store,
		[key]: {
			participants,
			messages,
			lastMessageUnix: timestamp,
		},
	};
}

export function mapMessagesForViewer(
	thread: ConversationThread | undefined,
	viewerEmail: string
): Message[] {
	if (!thread) {
		return [];
	}
	const normalizedViewer = normalizeEmail(viewerEmail);
	return thread.messages.map((message) => ({
		id: message.id,
		from: message.from === normalizedViewer ? "out" : "in",
		text: message.text,
	}));
}

export function getLastActivityTimestamp(thread?: ConversationThread) {
	if (!thread) {
		return null;
	}
	return thread.lastMessageUnix ?? thread.messages[thread.messages.length - 1]?.timestamp ?? 0;
}

export function formatLastActivity(timestamp?: number) {
	if (!timestamp) {
		return "";
	}
	return new Date(timestamp).toLocaleString();
}

function hashEmailToNumber(email: string) {
	const normalized = normalizeEmail(email);
	let hash = 0;
	for (let i = 0; i < normalized.length; i += 1) {
		hash = (hash << 5) - hash + normalized.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

export function buildAccountThreadId(email: string, namespace: keyof typeof THREAD_ID_OFFSETS) {
	const hash = hashEmailToNumber(email);
	const offset = THREAD_ID_OFFSETS[namespace];
	return offset + (hash % THREAD_ID_MOD);
}

export function getConversationRequest(store: ConversationRequestStore, a: string, b: string) {
	if (!a || !b) return undefined;
	const key = getConversationKey(a, b);
	return store[key];
}

export function upsertConversationRequest(
	store: ConversationRequestStore,
	params: { initiator: string; recipient: string; direction: ConversationRequestDirection }
) {
	const initiator = normalizeEmail(params.initiator);
	const recipient = normalizeEmail(params.recipient);
	const key = getConversationKey(initiator, recipient);
	return {
		...store,
		[key]: {
			key,
			initiator,
			recipient,
			direction: params.direction,
			createdAt: Date.now(),
		},
	};
}

export function removeConversationRequest(store: ConversationRequestStore, a: string, b: string) {
	if (!a || !b) return store;
	const key = getConversationKey(a, b);
	if (!store[key]) return store;
	const next = { ...store };
	delete next[key];
	return next;
}
