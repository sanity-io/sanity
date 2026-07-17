// Skip vanilla-extract's runtime style injection in jsdom: inserting real stylesheets for every
// imported .css.ts module slows the suite down, and no jsdom test asserts on computed styles or
// vanilla-extract class names (visual behavior is covered by the vitest browser mode and
// Playwright e2e suites). See https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles
// oxlint-disable-next-line no-unassigned-import
import '@vanilla-extract/css/disableRuntimeStyles'
