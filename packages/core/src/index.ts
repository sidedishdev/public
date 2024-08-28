const SIDEDISH_API = 'https://api.sidedish.dev/v1';
const SESSIONS_URL = `${SIDEDISH_API}/sessions`;

declare const window: unknown;
declare const document: unknown;

export type Purchase = {
	productId: string;
	data?: unknown;
};

export type AcceptableParameters = {
	userId: string;
	userName?: string;
	user?: unknown;
	accountId?: string;
	accountName?: string;
	account?: unknown;
	purchases: (string | Purchase)[];
};

export interface CreateResponseType {
	sessionId: string;
	expiresAt: string;
}

export async function createSession({
	apiKey,
	storeId,
	domain,
	data,
}: {
	apiKey: string;
	storeId?: string;
	domain?: string;
	data: AcceptableParameters;
}): Promise<CreateResponseType> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'createSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(SESSIONS_URL, {
		method: 'POST',
		headers: {
			'X-API-Token': apiKey,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			storeId,
			domain,
			data,
		}),
	});
	const responseBody = await response.json();
	return responseBody as CreateResponseType;
}

export interface UpdateResponseType {
	sessionId: string;
	expiresAt: string;
}
export async function updateSession({
	apiKey,
	sessionId,
	data,
}: {
	apiKey: string;
	sessionId: string;
	data: AcceptableParameters;
}): Promise<UpdateResponseType> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'updateSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(`${SESSIONS_URL}/${sessionId}`, {
		method: 'PATCH',
		headers: {
			'X-API-Token': apiKey,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			data,
		}),
	});
	const responseBody = await response.json();
	return responseBody as UpdateResponseType;
}

export async function revokeSession({ apiKey, sessionId }: { apiKey: string; sessionId: string }): Promise<boolean> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'revokeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(`${SESSIONS_URL}/${sessionId}`, {
		method: 'DELETE',
		headers: {
			'X-API-Token': apiKey,
			'Content-Type': 'application/json',
		},
	});
	return response.ok;
}
