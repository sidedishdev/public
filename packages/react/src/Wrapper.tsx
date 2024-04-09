import React from 'react';

export interface CallbackEvent {
	action: string;
	payload: unknown;
}

const PARENT_DOMAIN_KEY = 'parentDomain';
const TOKEN_KEY = 'token';
const reservedKeys = [PARENT_DOMAIN_KEY, TOKEN_KEY] as const;
type ReservedKey = typeof reservedKeys[number];

export type UnsafeParams = {
	[K in ReservedKey]?: never
} & {
	[key: string]: unknown;
};

export interface WrapperParams {
	/** Url of your Integrations Captain store */
	url: string;
	/**
	 * Callback function to handle store path change.
	 * @param path new store path, e.g. /products/1
	 */
	onStorePathChange?: (path: string) => void;
	/**
	 * Callbacks function to handle message.
	 *
	 * If you want to return data to the store, return a non-undefined value.
	 */
	callback?: (e: CallbackEvent) => unknown;
	/**
	 * Custom style for the iframe.
	 */
	style?: React.CSSProperties;
	/**
	 * Custom class for the iframe.
	 */
	className?: string;
	/**
	 * Parameters to pass into the store.
	 * 
	 * These parameters are **unsafe** - they are passed directly to the store without validation and can be tampered with.
	 */
	unsafeParams: UnsafeParams;
}

type StorePathChangeEvent = {
	type: 'STORE_PATH_CHANGE';
	path: string;
};

function isStorePathChangeEvent(event: MessageEvent<unknown>): event is MessageEvent<StorePathChangeEvent> {
	return typeof event.data === 'object' && (event.data as any)['type'] === 'STORE_PATH_CHANGE';
}

export function Wrapper({ url, callback, style, className, onStorePathChange, unsafeParams }: WrapperParams) {
	const iframeRef = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(() => {
		if (url === undefined) {
			return;
		}

		const messageHandler = (event: MessageEvent<CallbackEvent>) => {
			if (event.origin !== new URL(url).origin) {
				return;
			}

			if (isStorePathChangeEvent(event)) {
				onStorePathChange?.(event.data.path);
			}

			if (event.data && callback) {
				const result = callback(event.data);
				if (result !== undefined && event.source instanceof Window) {
					event.source.postMessage(result, event.origin);
				}
			}
		};

		window.addEventListener('message', messageHandler);
		return () => window.removeEventListener('message', messageHandler);
	}, [url, callback]);

	const [urlWithParams, setUrlWithParams] = React.useState('');

	// useEffect instead of useMemo for better compatibility with SSR
	React.useEffect(() => {
		const domain = encodeURIComponent(window.location.origin);
		const newUrl = new URL(url);
		newUrl.searchParams.set('parentDomain', domain);
		for (const key in unsafeParams) {
			if (reservedKeys.includes(key as ReservedKey)) {
				throw new Error(`Key ${key} is reserved and cannot be used in unsafeParams`);
			}
			newUrl.searchParams.set(key, encodeURIComponent(JSON.stringify(unsafeParams[key])));
		}
		setUrlWithParams(newUrl.toString());
	}, [url]);

	return (
		<iframe
			ref={iframeRef}
			src={urlWithParams || url}
			className={className}
			style={{
				width: '100%',
				height: '100%',
				border: 'none',
				...style
			}}
			allow="clipboard-write"
			loading="lazy"
		/>
	);
}
