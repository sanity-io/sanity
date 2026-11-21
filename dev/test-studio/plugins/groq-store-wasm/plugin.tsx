import {definePlugin} from 'sanity'

import {GroqStoreDebugLayout} from './GroqStoreDebugBar'

/**
 * Shows the groq-store-wasm debug bar. The store itself is booted once per page by
 * `startGroqStore()` in `sanity.config.ts`; its service worker serves every workspace on the origin.
 */
export const groqStoreDebugBar = definePlugin({
  name: 'groq-store-wasm-debug-bar',
  studio: {components: {layout: GroqStoreDebugLayout}},
})
