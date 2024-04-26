const INTEGRATION_CAPTAIN_API = 'https://integrations.store/api/v1';

declare const window: unknown;
declare const document: unknown;

export type AcceptableParameters = {
	userId?: string;
	userName?: string;
	user?: unknown;
	accountId?: string;
	accountName?: string;
	account?: unknown;
};

export function createSafeSession({
	apiKey,
	storeId,
	domain,
	data,
}: {
	apiKey: string;
	storeId?: string;
	domain?: string;
	data: AcceptableParameters;
}): Promise<Response> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'createSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	return fetch(INTEGRATION_CAPTAIN_API, {
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
}

export function updateSafeSession({
	apiKey,
	sessionId,
	data,
}: {
	apiKey: string;
	sessionId: string;
	data: AcceptableParameters;
}): Promise<Response> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'updateSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	return fetch(INTEGRATION_CAPTAIN_API, {
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
}

export function revokeSafeSession({ apiKey, sessionId }: { apiKey: string; sessionId: string }): Promise<Response> {
	if (typeof window !== 'undefined' || typeof document !== 'undefined') {
		throw new Error(
			'revokeSafeSession should only be used server-side. You are about to leak your secret API key to the client.',
		);
	}

	return fetch(INTEGRATION_CAPTAIN_API, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			sessionId,
		}),
	});
}
