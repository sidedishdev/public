import React from 'react';

export const PARENT_DOMAIN_KEY = 'parentDomain';
export const TOKEN_KEY = 'token';
const reservedKeys = [PARENT_DOMAIN_KEY, TOKEN_KEY] as const;
type ReservedKey = (typeof reservedKeys)[number];

export type UnsafeParams = {
	[K in ReservedKey]?: never;
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
	/**
	 * Callback function to handle installed change.
	 *
	 * @param listingId id of the listing that has been installed or uninstalled
	 * @param installed new installed state
	 */
	onInstalledChange?: (listingId: string, installed: boolean) => void;
}

export interface StorePathChangeEvent {
	type: 'STORE_PATH_CHANGE';
	path: string;
}

function isStorePathChangeEvent(event: MessageEvent<unknown>): event is MessageEvent<StorePathChangeEvent> {
	return typeof event.data === 'object' && (event.data as any)['type'] === 'STORE_PATH_CHANGE';
}

export interface CallbackEvent {
	type: 'CALLBACK';
	action: string;
	payload: unknown;
}

function isCallbackEvent(event: MessageEvent<unknown>): event is MessageEvent<CallbackEvent> {
	return (
		typeof event.data === 'object' &&
		(event.data as any)['type'] === 'CALLBACK' &&
		(event.data as any)['action'] !== undefined
	);
}

export interface SetInstalledEvent {
	type: 'SET_INSTALLED';
	listingId: string;
	installed: boolean;
}

function isSetInstalledEvent(event: MessageEvent<unknown>): event is MessageEvent<SetInstalledEvent> {
	return typeof event.data === 'object' && (event.data as any)['type'] === 'SET_INSTALLED';
}

export type StoreEvent = StorePathChangeEvent | CallbackEvent | SetInstalledEvent;

export interface UnsafeParamsChangeEvent {
	type: 'UNSAFE_PARAMS_CHANGE';
	params: UnsafeParams;
}

export function isUnsafeParamsChangeEvent(
	event: MessageEvent<unknown>,
): event is MessageEvent<UnsafeParamsChangeEvent> {
	return typeof event.data === 'object' && (event.data as any)['type'] === 'UNSAFE_PARAMS_CHANGE';
}

export function Wrapper({
	url,
	callback,
	style,
	className,
	onStorePathChange,
	unsafeParams,
	onInstalledChange,
}: WrapperParams) {
	const iframeRef = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(() => {
		if (url === undefined) {
			return;
		}

		const messageHandler = (event: MessageEvent<unknown>) => {
			if (event.origin !== new URL(url).origin) {
				return;
			}

			if (isStorePathChangeEvent(event)) {
				onStorePathChange?.(event.data.path);
			}

			if (isSetInstalledEvent(event)) {
				onInstalledChange?.(event.data.listingId, event.data.installed);
			}

			if (event.data && callback && isCallbackEvent(event)) {
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
		if (!urlWithParams) {
			// If the url has not yet been formed, we supply params as query params for the initial page load
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
		} else {
			// If the url with params have already been formed, we update params with postMessage
			const iframe = iframeRef.current;
			if (!iframe) {
				console.warn('Iframe not found');
				return;
			}
			if (!iframe.contentWindow) {
				console.warn('Iframe contentWindow not found');
				return;
			}
			iframe.contentWindow.postMessage(
				{ type: 'UNSAFE_PARAMS_CHANGE', params: unsafeParams } satisfies UnsafeParamsChangeEvent,
				new URL(url).origin,
			);
		}
	}, [url, urlWithParams, unsafeParams]);

	return (
		<iframe
			ref={iframeRef}
			src={urlWithParams || url}
			className={className}
			style={{
				width: '100%',
				height: '100%',
				border: 'none',
				...style,
			}}
			allow="clipboard-write"
			loading="lazy"
		/>
	);
}
