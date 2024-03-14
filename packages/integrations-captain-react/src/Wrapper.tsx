import React from 'react';

export interface CallbackEvent {
	action: string;
	payload: unknown;
}

export interface WrapperParams {
	/** Url of your Integrations Captain store */
	url?: string	
	/**
	 * Callbacks function to handle message.
	 *
	 * If you want to return data to the store, return a non-undefined value.
	 */
	callback?: (e: CallbackEvent) => unknown;
}

export function Wrapper({ url, callback }: WrapperParams) {
	const iframeRef = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(() => {
		if (url === undefined) {
			return;
		}

		const messageHandler = (event: MessageEvent<CallbackEvent>) => {
			if (event.origin !== new URL(url).origin) {
				return;
			}

			if (event.data && callback) {
				const result = callback(event.data);
				if (result !== undefined && event.source instanceof Window) {
					event.source.postMessage(result, event.origin);
				}
			}
		}

		window.addEventListener('message', messageHandler);
		return () => window.removeEventListener('message', messageHandler);
	}, [url, callback]);

	return (
		<iframe
			ref={iframeRef}
			src={url}
			style={{
				width: '100%',
				height: '100%',
				border: 'none',
			}}
			allow='clipboard-write'
			loading='lazy'
		/>
	);
}
