import jwt from 'jsonwebtoken';

export interface PassableParamsType {
	[key: string]: unknown;
}

interface PassableParamsTypeWithApiKey extends PassableParamsType {
	apiKey: string;
}

// Override with environment variable intended for internal testing only
const STORE_EMBED_LINK = process.env.STORE_EMBED_LINK || 'https://integrations-captain.com/store-embed';

export function createMagicLink(params: PassableParamsTypeWithApiKey): string {
	const { apiKey, ...payload } = params;
	const token = jwt.sign(payload, apiKey, { expiresIn: '1h' });
	return `${STORE_EMBED_LINK}?token=${token}`;
}
