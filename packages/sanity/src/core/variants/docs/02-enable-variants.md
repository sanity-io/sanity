---
title: Enable variants
description: Package versions, beta access, and the workspace config needed to turn variants on.
beta: true
---

# Enable variants

Three steps: upgrade your packages, get your project added to the beta, and set the config flag. All three are required. The Variant definitions tool won't appear without the flag, and queries won't return variant content without beta access on the project.

## 1. Upgrade your packages

### Studio

```bash
npm i sanity@latest
```

6.9.0 is the minimum version. Use `@latest` if you can.

### Frontend

```bash
npm i @sanity/client@latest
```

7.26.0 is the minimum version. Use `@latest` if you can.

If you render variant content in a preview or use visual editing, upgrade these together. They shipped as one coordinated release, so mixing old and new versions gives you a preview that ignores the variant picker:

| Package                      | Minimum |
| ---------------------------- | ------- |
| `@sanity/client`             | 7.26.0  |
| `next-sanity`                | 13.3.0  |
| `@sanity/visual-editing`     | 5.7.0   |
| `@sanity/react-loader`       | 2.1.0   |
| `@sanity/core-loader`        | 2.1.0   |
| `@sanity/svelte-loader`      | 2.1.0   |
| `@sanity/preview-url-secret` | 4.1.0   |

```bash
npm i @sanity/client@latest next-sanity@latest @sanity/visual-editing@latest \
  @sanity/react-loader@latest @sanity/preview-url-secret@latest
```

## 2. Get your project added to the beta

Variant content is served only to projects on the feature flag. Contact your Sanity account team or support to have your project added.

Until that lands, the Studio config below will render the Variant definitions tool, but you won't be able to create variants.

## 3. Set the workspace config

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...rest of your config
  beta: {
    variants: {
      enabled: true,
    },
  },
})
```

Restart the Studio. You should see a **Variant definitions** item in the navbar, routed at `/variants`, and a **View as** row in the document editor navbar.

<!-- IMAGE: Annotated Studio screenshot showing both things this flag turns on: the "Variant definitions" item in the navbar, and the "View as" row above the document editor with its Version and Variant selectors. This is the "did it work?" checkpoint, so call out both with labels. -->

Turning this on also switches on the document group inventory, the newer UI for managing and navigating a document's versions and variants. It replaces the version chips that used to sit above the document editor, and it is not optional while variants are on. The first time an editor opens a document they'll see a hint reading "Where did the version buttons go?" pointing at the new **Manage versions** button.

<!-- IMAGE: The document group inventory open on a document that has base draft, base published, and at least one variant, with the "Create variant" entry point visible. This screenshot does double duty: it orients people who lost the version chips, and it shows the variant creation flow described in Variant documents. -->

The `beta.variants.enabled` key is provisional and may be renamed before general availability.

## 4. Set the API version on your client

Variants are served only by the `X` version of the Content Lake API. `X` is the literal letter, not a placeholder for a number, and no dated version serves variant content yet.

```ts
import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  apiVersion: 'X',
  useCdn: false,
})
```

If you're calling the HTTP API directly, use `/vX/` in the path. `next-sanity` exports the same value as `variantsApiVersion` if you'd rather not hardcode it.

Pinning to `X` means you're on a moving API version. Expect behavior to change during the beta, and plan to move to a dated version at general availability.

## Verify it worked

Three checks, in order:

1. **The tool renders.** Visit `/variants` in your Studio. You should get the variant definitions overview, with an empty state if you haven't created any.
2. **A variant document saves.** Create a definition in the Variant definitions tool, open any document, pick the variant from the **View as** row, click **Create variant**, and type something. The change should save to the variant, and switching back to **All users (Default)** should show your untouched base content.
3. **A query returns it.** Publish the variant, then query with its conditions. If you get base content back, the project is probably not on the flag yet.

```ts
const data = await client.fetch(`*[_type == "page"][0]{title}`, {}, {variant: {audience: 'loyal'}})
```

## Next

[Variant definitions](./03-variant-definitions.md) covers creating the definitions themselves. If you're rolling this out to a team, read [Known limitations](./09-known-limitations.md) first.
