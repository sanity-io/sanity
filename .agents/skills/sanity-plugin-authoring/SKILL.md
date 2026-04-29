---
name: sanity-plugin-authoring
description: Explain and create Sanity Studio plugins using the public plugin and tool APIs. Use when creating user-facing plugins, adding tools through plugins, or when an agent needs to understand what a Sanity plugin can configure before applying monorepo-specific default plugin wiring.
---

# Sanity Plugin Authoring

## What A Plugin Is

A Sanity Studio plugin is a named configuration bundle that can be added to a Studio through the `plugins` array. Plugin configuration accepts most workspace config properties, except workspace-owned settings such as `dataset`, `projectId`, `auth`, and `theme`.

Always give plugins a stable unique `name`. Prefer `definePlugin()` so editors expose useful types and autocomplete.

```ts
import {definePlugin} from 'sanity'

export const previewUrlPlugin = definePlugin({
  name: 'preview-url-plugin',
  document: {
    productionUrl: async (prev, {document}) => {
      const slug = document.slug?.current
      return slug ? `https://example.com/${slug}` : prev
    },
  },
})
```

## Configurable Plugins

Use `definePlugin((options) => ({...}))` when callers need to configure behavior.

```ts
export const myPlugin = definePlugin<{enabled?: boolean}>((options) => ({
  name: 'my-plugin',
  tools: options.enabled === false ? [] : [myTool],
}))
```

Keep option namespaces extensible. Prefer object shapes such as `{feature: {enabled: true}}` instead of direct booleans when future settings are likely.

## What Plugins Can Provide

Common plugin properties:

- `document`: Document actions, badges, production URL resolvers, and new document defaults.
- `form`: Form customizations, asset sources, and custom input rendering.
- `plugins`: Nested plugins.
- `tools`: Studio tools contributed by the plugin.
- `schema`: Schema types and initial value templates.
- `studio`: Studio component overrides and middleware.
- `title`: Human-readable plugin name.
- `onUncaughtError`: Custom error handling, logging, or telemetry.

Use the smallest surface that solves the feature.

## Tools In Plugins

A tool is a top-level Studio view with routing and predictable URLs. Tools commonly represent full-screen workflows such as Structure, Vision, Dashboard, or Presentation.

When adding a tool through a plugin:

- Add it through the plugin `tools` property.
- Give it a stable `name`, `title`, `component`, and router when needed.
- Remember tool visual order is affected by the order tools are added, followed by tools added through plugins.
- Use `studio.components.toolMenu` when the visual menu order needs custom rendering.
- Use the top-level `tools` reducer pattern when changing the default opened tool, because visual menu order alone does not choose the default route.

## Studio Components

`studio.components` can customize parts of the Studio UI. Components that receive `renderDefault` are middleware: call `props.renderDefault(props)` unless intentionally replacing the default UI.

Use this for UI wrappers, navigation changes, or tool menu ordering. Be careful not to change scroll containers or layout ownership accidentally.

## Before Coding

1. Identify whether the feature is a plugin, a tool, a schema extension, a form extension, or a document extension.
2. Check existing plugin examples in the repo.
3. Choose a stable plugin name.
4. Decide whether the plugin needs options.
5. Add focused tests for the configured behavior.

For Sanity monorepo default plugin wiring, read `sanity-core-plugin` after this skill.

## References

- [Sanity Studio Plugins](https://www.sanity.io/docs/studio/studio-plugins)
- [Sanity Plugins API](https://www.sanity.io/docs/studio/plugins-api-reference)
- [Sanity Studio Tools](https://www.sanity.io/docs/studio/studio-tools)
- [Sanity Tools Cheat Sheet](https://www.sanity.io/docs/studio/tools-cheat-sheet)
