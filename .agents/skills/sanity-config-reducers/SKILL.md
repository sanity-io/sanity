---
name: sanity-config-reducers
description: Add and review Sanity config properties that are reduced across root config and plugins. Use when adding beta flags, feature config, workspace/source options, default plugin gates, or resolved Source fields in packages/sanity/src/core/config.
---

# Sanity Config Reducers

## Start Here

Use this skill when a config value can be supplied by root config or plugins and needs deterministic merge behavior.

Inspect these files first:

- `packages/sanity/src/core/config/types.ts`
- `packages/sanity/src/core/config/configPropertyReducers.ts`
- `packages/sanity/src/core/config/prepareConfig.tsx`
- `packages/sanity/src/core/config/flattenConfig.ts`
- `packages/sanity/src/core/config/resolveDefaultPlugins.ts` if the config gates default plugin injection.

## Reducer Pattern

Reducers usually:

1. Call `flattenConfig(config, [])`.
2. Reduce from an explicit `initialValue`.
3. Read the property from each `innerConfig`.
4. Ignore `undefined`.
5. Accept only the documented type.
6. Throw with `getPrintableType(value)` for invalid values.

Config namespaces should usually be objects, even when they initially only contain one flag. This keeps room for future options without changing the public shape. For booleans, prefer `feature.enabled` and follow this shape:

```ts
export const featureEnabledReducer = (opts: {
  config: PluginOptions
  initialValue: boolean
}): boolean => {
  const {config, initialValue} = opts
  const flattenedConfig = flattenConfig(config, [])

  return flattenedConfig.reduce((acc, {config: innerConfig}) => {
    const enabled = innerConfig.feature?.enabled

    if (typeof enabled === 'undefined') return acc
    if (typeof enabled === 'boolean') return enabled

    throw new Error(
      `Expected \`feature.enabled\` to be a boolean, but received ${getPrintableType(enabled)}`,
    )
  }, initialValue)
}
```

Root config is flattened after plugin config, so root values usually win when a reducer overwrites with the latest defined value.

## Types And Exposure

When adding a config property:

- Declare the public or internal input type in `PluginOptions`, `WorkspaceOptions`, or the relevant nested type in `types.ts`.
- Prefer extensible object namespaces such as `beta.feature.enabled` over direct booleans such as `beta.feature`.
- If runtime code needs the resolved value, expose it on `Source`, `Workspace`, or the relevant prepared object in `prepareConfig.tsx`.
- Keep raw config access through `source.__internal.options` as an implementation detail, not the primary runtime API.

## Default Plugin Gates

Default plugin lists are computed before full source resolution. If a config value controls default plugin injection:

- Compute the reduced value early enough in `prepareConfig.tsx`, before calling `getDefaultPlugins`.
- Thread that reduced value into `getDefaultPluginsOptions` or the options passed to `getDefaultPlugins`.
- Use the same reducer later when exposing the resolved runtime value, so gating and runtime context agree.
- Add tests for default false/true behavior and invalid values.

## Beta Flags

Beta flags live under `BetaFeatures` in `types.ts` and resolved runtime values under `source.beta`.

Prefer a dedicated reducer when:

- Plugins can set or override the flag.
- Invalid values should produce helpful errors.
- The flag gates default plugin injection.

Do not special-case beta flags in components by reading raw config if a resolved value can be exposed instead.

## Verification

Add focused config tests for:

- Default value.
- Root config value.
- Plugin-provided value.
- Root-over-plugin precedence when relevant.
- Invalid namespace object error message when the top-level config is malformed.
- Invalid nested property error message, for example when `enabled` is not the documented type.
