---
name: sanity-default-plugins
description: Create and wire Sanity core plugins using the monorepo's default plugin conventions. Use when adding, modifying, or reviewing plugins under packages/sanity/src/core, especially plugins added through resolveDefaultPlugins or studio.components middleware.
---

# Sanity Core Plugin

## Start Here

Before adding a core plugin, read the `sanity-plugin-authoring` skill at `../sanity-plugin-authoring/SKILL.md` to understand the general Sanity plugin API and what plugins can provide. Then inspect nearby plugins and these files:

- `packages/sanity/src/core/config/resolveDefaultPlugins.ts`
- `packages/sanity/src/core/config/types.ts`
- `packages/sanity/src/core/config/studio/types.ts`
- A similar plugin under `packages/sanity/src/core/*/plugin/`

The new plugin should be added inside `core` so it can be imported into the default plugins.

Prefer local patterns over new abstractions.

## Plugin Shape

Use `definePlugin` and export a stable internal name constant:

```ts
import {definePlugin} from '../../config/definePlugin'

export const FEATURE_NAME = 'sanity/feature'

export const feature = definePlugin({
  name: FEATURE_NAME,
  studio: {
    components: {
      layout: FeatureStudioLayout,
    },
  },
  i18n: {
    bundles: [featureUsEnglishLocaleBundle],
  },
})
```

Use `../../config/definePlugin` when matching existing internal plugin files. `../../config` is also available in some folders.

## Locale Resources

Default core plugins that render UI text should add a locale resource bundle. Follow the pattern from `packages/sanity/src/core/singleDocRelease`:

- `packages/sanity/src/core/<feature>/i18n/index.ts`: exports the locale namespace, US English bundle, and resource key type.
- `packages/sanity/src/core/<feature>/i18n/resources.ts`: exports default locale strings and `keyof` resource type.
- `packages/sanity/src/core/<feature>/plugin/index.ts`: imports the bundle and registers it under `i18n.bundles`.

Example `i18n/index.ts`:

```ts
import {type LocaleResourceBundle} from '../../i18n'

export const featureNamespace: 'feature' = 'feature'

export const featureUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: featureNamespace,
  resources: () => import('./resources'),
}

export type {FeatureLocaleResourceKeys} from './resources'
```

Example `i18n/resources.ts`:

```ts
const featureLocaleStrings = {
  'action.example': 'Example',
}

export type FeatureLocaleResourceKeys = keyof typeof featureLocaleStrings

export default featureLocaleStrings
```

Example plugin registration:

```ts
import {featureUsEnglishLocaleBundle} from '../i18n'

export const feature = definePlugin({
  name: FEATURE_NAME,
  i18n: {
    bundles: [featureUsEnglishLocaleBundle],
  },
})
```

## Default Plugin Wiring

Default core plugins are listed in `resolveDefaultPlugins.ts`.

1. Import the plugin and its name constant.
2. Add the plugin to `defaultPlugins(options)` in the desired composition order.
3. If gated, add a `plugin.name === FEATURE_NAME` branch in `getDefaultPlugins`.
4. Add any required options to `DefaultPluginsWorkspaceOptions` in `types.ts`.
5. In `getDefaultPluginsOptions`, build default plugin options directly from workspace config defaults and spreads. Do not call config property reducers here; reducers belong to resolved source/workspace config, while default plugin options are a lightweight workspace-level input for plugin insertion.
6. Update `packages/sanity/src/core/config/__tests__/resolveConfig.test.ts` with focused default plugin tests:
   - The plugin is not added by default.
   - The plugin is added when the proper config flag is enabled.
7. Add ordering coverage when plugin order affects UI composition.

Example default option shape:

```ts
variants: {
  enabled: false,
  ...workspace.beta?.variants,
}
```

Remember: user plugins are appended before default plugins in `prepareConfig.tsx`, then the component middleware chain reverses flattened config order. Check the existing chain before relying on wrapper order.

## Verification

For default plugin changes, run:

```sh
pnpm vitest run --project=sanity packages/sanity/src/core/config/__tests__/resolveConfig.test.ts
```

Also run lint/read diagnostics for edited files. Add component-level tests only when the plugin changes runtime rendering beyond insertion.
