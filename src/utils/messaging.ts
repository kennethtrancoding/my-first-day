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
	from: number;
	text: string;
	timestamp: number;
}

export interface ConversationThread {
	participants: [number, number];
	messages: ConversationMessage[];
	lastMessageUnix?: number;
}

export type ConversationStore = Record<string, ConversationThread>;
export type ConversationRequestDirection = "student_to_mentor" | "mentor_to_student";

export interface ConversationRequest {
	key: string;
	initiator: number;
	recipient: number;
	direction: ConversationRequestDirection;
	createdAt: number;
}

export type ConversationRequestStore = Record<string, ConversationRequest>;

export function getConversationKey(a: number, b: number) {
	const [first, second] = [a, b].sort((x, y) => x - y);
	return `${first}__${second}`;
}

function withThreadParticipants(a: number, b: number): [number, number] {
	return [a, b].sort((x, y) => x - y) as [number, number];
}

export function appendConversationMessage(
	store: ConversationStore,
	params: { from: number; to: number; text: string }
): ConversationStore {
	const sender = params.from;
	const recipient = params.to;
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
	viewerId: number
): Message[] {
	if (!thread) return [];
	return thread.messages.map((message) => ({
		id: message.id,
		from: message.from === viewerId ? "out" : "in",
		text: message.text,
	}));
}

export function getLastActivityTimestamp(thread?: ConversationThread) {
	if (!thread) return null;
	return thread.lastMessageUnix ?? thread.messages[thread.messages.length - 1]?.timestamp ?? 0;
}

export function formatLastActivity(timestamp?: number) {
	if (!timestamp) return "";
	return new Date(timestamp).toLocaleString();
}

function hashIdToNumber(id: number) {
	let hash = 0;
	const str = id.toString();
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

export function buildAccountThreadId(id: number, namespace: keyof typeof THREAD_ID_OFFSETS) {
	const hash = hashIdToNumber(id);
	const offset = THREAD_ID_OFFSETS[namespace];
	return offset + (hash % THREAD_ID_MOD);
}

export function getConversationRequest(store: ConversationRequestStore, a: number, b: number) {
	if (a == null || b == null) return undefined;
	const key = getConversationKey(a, b);
	return store[key];
}

export function upsertConversationRequest(
	store: ConversationRequestStore,
	params: {
		initiator: number;
		recipient: number;
		direction: ConversationRequestDirection;
	}
) {
	const { initiator, recipient } = params;
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

export function removeConversationRequest(store: ConversationRequestStore, a: number, b: number) {
	if (a == null || b == null) return store;
	const key = getConversationKey(a, b);
	if (!store[key]) return store;
	const next = { ...store };
	delete next[key];
	return next;
}
