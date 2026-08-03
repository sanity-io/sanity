import {createRequire} from 'node:module'

import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {type StorybookConfig} from '@storybook/react-vite'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'
import {defaultClientConditions, mergeConfig} from 'vite'

// The mock Content Lake (lib/mockContentLake.ts) evaluates GROQ in the browser with groq-js, so
// search stories can return real hits offline. groq-js is a dependency of `packages/sanity`, not of
// this workspace package, and pnpm's strict layout means a bare import here would not resolve. We
// resolve it through packages/sanity rather than adding a dependency + lockfile churn for a
// dev-only harness. Computed, not hardcoded, so a version bump does not silently break it.
const groqJsPath = createRequire(
  new URL('../../../packages/sanity/package.json', import.meta.url),
).resolve('groq-js')

// Same story for `@sanity/comlink`. The Presentation preview target (stories/presentation/
// PreviewTarget.stories.tsx) opens a real comlink node so the Preview iframe's handshake
// genuinely completes, and comlink is a dependency of `packages/sanity` rather than of this
// package. Unlike `@sanity/diff` it ships as dist-only, so a deep source import is not an
// option - resolve it from the package that does depend on it, exactly as groq-js is.
const comlinkPath = createRequire(
  new URL('../../../packages/sanity/package.json', import.meta.url),
).resolve('@sanity/comlink')

// Compile the sanity source tree with the React Compiler, exactly as `sanity dev`
// does (see dev/test-studio/sanity.cli.ts `reactCompiler`): several core components
// depend on compiler memoization for referential stability — e.g. `useDocumentForm`'s
// `onChange` is a plain function whose identity the compiler stabilizes; uncompiled,
// mounting a real DocumentPane render-loops through CopyPasteProvider's
// `setDocumentMeta` ("Maximum update depth exceeded", found in wave 4a). Scoped to
// `packages/sanity/src` so story/lib files keep their untransformed semantics.
const reactCompilerSources = /\/packages\/sanity\/src\/.*\.tsx?$/

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // Fixture assets that must be reachable over HTTP rather than inlined. ImageReferencePreview
  // builds its src as `${asset.url}?h=800&fit=max`, so a data: URI is corrupted by the appended
  // query string and the preview spins on "Loading" forever. A served file takes the params
  // harmlessly.
  staticDirs: ['../static'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      // The react-vite framework does not add a React plugin itself; without it,
      // JSX in .tsx files imported from outside this package fails to parse at
      // build time (same reason sanity-ui's storybook adds it in viteFinal).
      plugins: [
        viteReact(),
        // Same wiring as packages/@repo/package.bundle: plugin-react v6 has no
        // `babel` option; the compiler preset rides a separate babel plugin pass.
        babel({
          presets: [
            reactCompilerPreset({
              target: '19',
              sources: (filename: string) => reactCompilerSources.test(filename),
            }),
          ],
        }),
        vanillaExtractPlugin(),
      ],
      resolve: {
        // `sanity` (workspace:*) resolves to packages/sanity/src via the `monorepo`
        // exports condition — the same mechanism `sanity dev` uses in dev/test-studio.
        // Without it, self-referencing subpath imports inside the sanity source tree
        // (e.g. `sanity/_singletons` from ui-components/errorBoundary) fail to resolve.
        // `resolve.conditions` REPLACES Vite's defaults, hence the explicit spread.
        conditions: ['monorepo', ...defaultClientConditions],
        alias: {'groq-js': groqJsPath, '@sanity/comlink': comlinkPath},
      },
      // Pre-bundling `sanity` duplicates its singleton context providers when vite
      // chunks lazy imports (see dev/test-studio/sanity.cli.ts), so keep it excluded.
      optimizeDeps: {exclude: ['sanity']},
    })
  },
}
export default config
