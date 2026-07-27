/// <reference path="../.astro/types.d.ts" />
interface Window {
    Alpine: import('alpinejs').Alpine;
}

declare namespace App {
    interface Locals {
        user: import('./lib/fake-auth').FakeUser | null;
        /**
         * Keys of embedded content items (content area items, composition
         * components) the current user may read, resolved per request in
         * view mode. `undefined`/`null` means enforcement is not active
         * (edit/preview contexts, component preview, Astrobook).
         */
        allowedContentKeys?: Set<string> | null;
    }
}
