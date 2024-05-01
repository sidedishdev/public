import React, { Ref, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

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

export enum StoreMessages {
	pathChanged = 'STORE_PATH_CHANGED',
	callback = 'CALLBACK',
	unsafeParamsChange = 'UNSAFE_PARAMS_CHANGE',
	sessionReload = 'SESSION_RELOAD',
}

export interface PathChangedEventMessage {
	type: 'STORE_PATH_CHANGED';
	path: string;
}
export interface CallbackEventMessage {
	type: 'CALLBACK';
	actionIdentifier: string;
	payload: unknown;
}
export type CallbackEvent = Omit<CallbackEventMessage, 'type'>;

export interface StoreProps {
	style?: React.CSSProperties;
	className?: string;

	url: string;
	sessionId?: string;
	page?: string;
	listingId?: string;
	unsafeParams?: AcceptableParameters;

	/**
	 * Callback function to handle store path change.
	 * @param path new store path, e.g. /l/demo-listing
	 */
	onPathChange?: (path: string) => void;

	/**
	 * Callbacks function to handle callback actions thrown from store.
	 */
	onCallback?: (e: CallbackEvent) => void;
}

export interface StoreComponentMethods {
	reloadSession: () => void;
	updateUnsafeParams: (params: AcceptableParameters) => void;
}

export interface UnsafeParamsChangeMessage {
	type: StoreMessages.unsafeParamsChange;
	params: AcceptableParameters;
}
export interface SessionReloadMessage {
	type: StoreMessages.sessionReload;
}
export type Message = UnsafeParamsChangeMessage | SessionReloadMessage;

export type StoreEventMessage = PathChangedEventMessage | CallbackEventMessage;
function isEventType(event: MessageEvent<unknown>, type: string): event is MessageEvent<StoreEventMessage> {
	if (event && event.data && typeof event.data === 'object' && 'type' in event.data && event.data['type'] === type)
		return true;
	return false;
}
const isStorePathChangeEvent = (event: MessageEvent<unknown>): event is MessageEvent<PathChangedEventMessage> =>
	isEventType(event, StoreMessages.pathChanged);
const isCallbackEvent = (event: MessageEvent): event is MessageEvent<CallbackEventMessage> =>
	isEventType(event, StoreMessages.callback);

export const Store = forwardRef(
	(
		{ style, className, url, page, listingId, sessionId, unsafeParams, onPathChange, onCallback }: StoreProps,
		ref: Ref<StoreComponentMethods>,
	) => {
		const iframeRef = useRef<HTMLIFrameElement>(null);

		const postMessage = (message: Message) => {
			const iframe = iframeRef.current;
			if (!iframe) {
				console.warn('Iframe not found');
				return;
			}
			if (!iframe.contentWindow) {
				console.warn('Iframe contentWindow not found');
				return;
			}
			iframe.contentWindow.postMessage(message, new URL(url).origin);
		};

		// expose methods to parent
		useImperativeHandle(ref, () => ({
			// tell the store to reload the session when the session data was updated
			reloadSession() {
				postMessage({ type: StoreMessages.sessionReload } satisfies SessionReloadMessage);
			},
			// update the unsafe params without changing the url
			updateUnsafeParams(params: AcceptableParameters) {
				postMessage({ type: StoreMessages.unsafeParamsChange, params } satisfies UnsafeParamsChangeMessage);
			},
		}));

		// listen for messages from the store
		useEffect(() => {
			// we need url to check origin
			if (!url) {
				return;
			}
			// if no callback or path change handler is provided, we don't need to listen for messages
			if (!onCallback && !onPathChange) return;

			const messageHandler = (event: MessageEvent<unknown>) => {
				// we only listen to events from the store
				if (event.origin !== new URL(url).origin) {
					return;
				}

				if (isStorePathChangeEvent(event) && onPathChange) {
					return onPathChange(event.data.path);
				}

				if (isCallbackEvent(event) && onCallback) {
					return onCallback(event.data);
				}
			};

			// bind to window
			window.addEventListener('message', messageHandler);

			// cleanup
			return () => window.removeEventListener('message', messageHandler);
		}, [url, onCallback, onPathChange]);

		const [urlWithParams, setUrlWithParams] = React.useState('');

		React.useEffect(() => {
			if (!urlWithParams) {
				// If the url has not yet been formed, we supply params as query params for the initial page load
				const newUrl = new URL(url);

				if (unsafeParams) {
					for (const key in unsafeParams) {
						// @ts-ignore
						newUrl.searchParams.set(`$${key}`, encodeURIComponent(JSON.stringify(unsafeParams[key])));
					}
				}
				if (sessionId) {
					newUrl.searchParams.set('sessionId', sessionId);
				}
				if (page) {
					newUrl.pathname = `/p=${page}${newUrl.pathname}`;
				}
				if (listingId) {
					newUrl.pathname = `/l/${listingId}`;
				}

				setUrlWithParams(newUrl.toString());
			} else if (unsafeParams) {
				postMessage({
					type: StoreMessages.unsafeParamsChange,
					params: unsafeParams,
				} satisfies UnsafeParamsChangeMessage);
			}
		}, [url, unsafeParams]);

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
	},
);

Store.displayName = 'Store';
