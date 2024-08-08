const SIDEDISH_API_URL = process.env.SIDEDISH_API_URL ?? 'https://api.sidedish.dev/v1';
const SAFE_SESSION_URL = `${SIDEDISH_API_URL}/safe-sessions`;

declare const window: unknown;
declare const document: unknown;

export type Purchase = {
	listingId: string;
	data?: unknown;
};

export type AcceptableParameters = Partial<{
	userId: string;
	userName: string;
	user: unknown;
	accountId: string;
	accountName: string;
	account: unknown;
	purchases: (string | Purchase)[];
}>;

export interface CreateResponseType {
	sessionId: string;
	expiresAt: string;
}
export async function createSafeSession({
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
			'createSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(SAFE_SESSION_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
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
export async function updateSafeSession({
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
			'updateSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(SAFE_SESSION_URL, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			sessionId,
			data,
		}),
	});
	const responseBody = await response.json();
	return responseBody as UpdateResponseType;
}

export async function revokeSafeSession({
	apiKey,
	sessionId,
}: {
	apiKey: string;
	sessionId: string;
}): Promise<boolean> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'revokeSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	const response = await fetch(SAFE_SESSION_URL, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			sessionId,
		}),
	});
	return response.ok;
}
