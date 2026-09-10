import {fileURLToPath} from 'node:url'

import {storybookTest} from '@storybook/addon-vitest/vitest-plugin'
import {playwright} from '@vitest/browser-playwright'
import {defineConfig} from 'vitest/config'

// Runs every story as a vitest browser-mode test (render + play functions)
// via portable stories. This project is intentionally NOT registered in the
// root vitest.config.mts multi-project run for the same reason the
// `sanity-browser` project isn't: it needs a real browser. Run it with
// `pnpm --filter sanity-storybook test`.
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
      // Used by vitest watch mode to link test failures to the story UI.
      storybookScript: 'pnpm dev',
    }),
  ],
  test: {
    name: 'storybook',
    // Story harnesses boot the full studio form builder; give them the same
    // generous timeouts as the sanity-browser project.
    testTimeout: 30_000,
    retry: 1,
    expect: {poll: {timeout: 10_000}},
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: {width: 1280, height: 900},
      instances: [{browser: 'chromium'}],
    },
  },
})
