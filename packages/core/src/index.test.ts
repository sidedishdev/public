import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { Payload, createMagicLink, decodeMagicLink } from '.';

// Type-only test — verifies that Payload type forbids reserved keys
({
    // @ts-expect-error
    iss: 'foo',
} satisfies Payload);

describe(createMagicLink.name, () => {
    describe('when used on the server side', () => {
        it('should encode a valid token', () => {
            const payload = {
                foo: 'bar',
                baz: 42,
            };
            const apiKey = 'hunter2';
            const domain = 'http://demo.integrations.store';

            const magicLink = createMagicLink(apiKey, domain, payload, true);

            const url = new URL(magicLink);
            const token = url.searchParams.get('token');
            expect(token).toBeDefined();
        });

        it('should throw an error if reserved key is used', () => {
            const payload = {
                iss: 'foo',
            } as unknown as Payload;
            const apiKey = 'hunter2';
            const domain = 'http://demo.integrations.store';

            expect(() => createMagicLink(apiKey, domain, payload, true)).toThrow();
        });
    });

    describe('when used on the client side', () => {
        const originalWindow: any = (global as any).window, originalDocument: any = (global as any).document;

        beforeEach(() => {
            (global as any).window = {} as any;
            (global as any).document = {} as any;
        });

        afterEach(() => {
            (global as any).window = originalWindow;
            (global as any).document = originalDocument;
        });

        it('should throw an error', () => {
            const payload = {
                foo: 'bar',
                baz: 42,
            };
            const apiKey = 'hunter2';
            const domain = 'http://demo.integrations.store';

            expect(() => createMagicLink(apiKey, domain, payload)).toThrow();
        });
    });
});

describe(decodeMagicLink.name, () => {
    it('should decode a valid token', () => {
        const payload = {
            foo: 'bar',
            baz: 42,
        };
        const apiKey = 'hunter2';
        const domain = 'http://demo.integrations.store';
        
        const magicLink = createMagicLink(apiKey, domain, payload);
        const decodedPayload = decodeMagicLink(apiKey, magicLink);

        expect(decodedPayload).toEqual(payload);
    });

    it('should throw an error if token is missing', () => {
        const apiKey = 'hunter2';
        const domain = 'http://demo.integrations.store?someOtherParam=42';

        expect(() => decodeMagicLink(apiKey, domain)).toThrow();
    });

    it('should throw an error if api key doesn\'t match', () => {
        const payload = {
            foo: 'bar',
            baz: 42,
        };
        const apiKey = 'hunter2';
        const wrongApiKey = '*******';
        const domain = 'http://demo.integrations.store';

        const magicLink = createMagicLink(apiKey, domain, payload);
        expect(() => decodeMagicLink(wrongApiKey, magicLink)).toThrow();
    });
});