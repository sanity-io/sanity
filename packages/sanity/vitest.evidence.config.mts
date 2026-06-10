import baseConfig from './vitest.browser.config.mts'

/**
 * Config for *.evidence.tsx visual-evidence stories. These render a component in
 * real headless Chromium and screenshot it (driven by scripts/visual-evidence.mjs);
 * they are NOT part of the assertion test suite, so they use a separate file glob
 * and are excluded from the normal `test:browser` run by their `.evidence.tsx` suffix.
 */
const config = {...baseConfig}
config.test = {
  ...baseConfig.test,
  name: 'sanity-evidence',
  include: ['./src/**/*.evidence.tsx'],
}
export default config
