import React from 'react';

interface StoreParams {
	/** Url of your Integrations Captain store */
	url: string	
}

export function Store({ url }: StoreParams) {
	const iframeRef = React.useRef<HTMLIFrameElement>(null);

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
