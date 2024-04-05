import jwt from 'jsonwebtoken';

declare const window: unknown;
declare const document: unknown;

// RFC 7519 Registered Claim Names
const RESERVED_KEYS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'] as const;
type ReservedKey = (typeof RESERVED_KEYS)[number];

export type Payload = {
	[K in ReservedKey]?: never
} & {
	[key: string]: unknown;
}

const VALID_TIME = "1h";

/**
 * Encode secret parameters into a magic link.
 * Only use this function on the server side.
 *
 * @param apiKey your SECRET API key
 * @param domain domain of your store, i.e. http://subdomain.integrations.store
 * @param payload parameters you wish to pass
 *
 * @returns a magic link you can send to the client
 */
export function createMagicLink(
	apiKey: string,
	domain: string,
	payload: Payload,
	UNSAFE_allowClient?: boolean
): string {
	if (!UNSAFE_allowClient && (typeof window !== 'undefined' || typeof document !== 'undefined')) {
		throw new Error(
			'createMagicLink should only be used server-side. You are about to leak your secret API key to the client.'
		);
	}
	for (const key of RESERVED_KEYS) {
		if (key in payload) {
			throw new Error(`Reserved key ${key} is not allowed in payload`);
		}
	}
	const token = jwt.sign(payload, apiKey, { expiresIn: VALID_TIME });
	const url = new URL(domain);
	url.searchParams.set('token', token);
	return url.toString();
}

/**
 * Verifies provided token and decodes payload against the secret API key.
 *
 * @param apiKey secret API key to verify token against
 * @param token containing encoded payload
 *
 * @returns encoded payload if token is valid
 * @throws if token is invalid or expired
 */
export function decodeToken(apiKey: string, token: string): Payload {
	const payload = jwt.verify(token, apiKey, { maxAge: VALID_TIME }) as Payload;
	for (const key of RESERVED_KEYS) {
		if (key in payload) {
			delete payload[key];
		}
	}
	return payload;
}

/**
 * Verifies provided url and decodes payload against the secret API key.
 *
 * @param apiKey secret API key to verify url against
 * @param url with token
 *
 * @returns encoded payload if token is valid
 * @throws if token is invalid or expired
 */
export function decodeMagicLink(apiKey: string, url: string): Payload {
	const urlObj = new URL(url);
	const queryParams = urlObj.searchParams;
	const token = queryParams.get('token');

	if (!token) {
		throw new Error('Token is missing');
	}

	return decodeToken(apiKey, token);
}