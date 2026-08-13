---
title: Presentation and visual editing
description: Preview variant content in context, including how the variant travels to your frontend and what to do with Next.js Cache Components.
beta: true
---

# Presentation and visual editing

Editing personalized content without seeing it rendered is guesswork. The Presentation tool carries the selected variant into your preview, so switching from **All users (Default)** to **Loyal customers** in the Studio updates the iframe to show what loyal customers will see.

The variant travels alongside the perspective, everywhere the perspective already travels.

<!-- IMAGE: Presentation with the Studio on the left and the preview iframe on the right, captured mid-switch so the variant picker and the changed hero copy are both visible. A short clip would be better than a still here. This is the best "sell the feature" image in the set and belongs at the top of the page. -->

## Requirements

| Package                      | Minimum |
| ---------------------------- | ------- |
| `@sanity/visual-editing`     | 5.7.0   |
| `@sanity/react-loader`       | 2.1.0   |
| `@sanity/core-loader`        | 2.1.0   |
| `@sanity/svelte-loader`      | 2.1.0   |
| `@sanity/preview-url-secret` | 4.1.0   |
| `next-sanity`                | 13.3.0  |
| `@sanity/client`             | 7.26.0  |

Upgrade these together. An older visual editing package with a current Studio gives you a preview that silently ignores the variant picker, which is a confusing failure to debug.

## How the variant reaches your frontend

Two paths, depending on what the frontend supports.

**As a search parameter.** The variant is set on the preview URL as `sanity-preview-variant`, holding the bare variant ID. The same value is available as a cookie of the same name, which is what lets a server-rendered page resolve the variant outside of Presentation.

**Over comlink.** When visual editing is connected, the Studio posts perspective and variant together as they change. The frontend applies the new variant and re-renders without a reload.

There's a capability handshake. Frontends on a current `@sanity/visual-editing` report that they handle variant changes themselves, and the Studio hands the change over. Older frontends don't report it, and the Studio reloads the iframe instead. Preview still works, it just reloads on every variant switch.

If you use a custom `previewUrl` function, the variant arrives as `studioPreviewVariant` alongside `studioPreviewPerspective`, so you can put it wherever your frontend expects it.

## Reacting to variant changes

**Visual editing** exposes `onVariantChange`:

```ts
import {enableVisualEditing} from '@sanity/visual-editing'

enableVisualEditing({
  onPerspectiveChange: setPerspective,
  onVariantChange: setVariant,
})
```

**The loaders** expose `onVariant`, on the live mode options rather than on the query store:

```ts
import {useLiveMode} from '@sanity/react-loader'

useLiveMode({
  client,
  onVariant: (variant) => {
    // Persist to a session cookie, if your rendering needs it server-side
  },
})
```

Both receive the bare variant ID, or `undefined` when the editor switches back to **All users (Default)**.

Note the asymmetry with `client.fetch`: the loaders' `variant` option is a single variant ID string, while `client.fetch` also accepts a conditions object. Presentation always sends an ID, because it previews one specific definition rather than simulating a visitor.

Set the client's `apiVersion` to `X` or variant fetches won't return variant content.

## Next.js

With `defineLive`, variant resolution is handled for you: the fetch reads the `sanity-preview-variant` cookie when draft mode is enabled and falls back to no variant when it isn't set.

### Cache Components

When `cacheComponents: true` is set, `cookies()` and `draftMode()` cannot be called inside a `'use cache'` boundary. Resolve the variant outside the boundary and pass it in as a prop, which also makes it part of the cache key:

```tsx
import {cookies} from 'next/headers'
import {resolveVariantFromCookies} from 'next-sanity/live'
import {sanityFetch} from '@/sanity/live'

export default async function Page({params}: PageProps<'/[slug]'>) {
  const jar = await cookies()
  const variant = await resolveVariantFromCookies({cookies: jar})
  const {slug} = await params

  return <CachedPage slug={slug} variant={variant} />
}

async function CachedPage({slug, variant}: {slug: string; variant: string | undefined}) {
  'use cache'

  const {data} = await sanityFetch({
    query: `*[_type == "page" && slug.current == $slug][0]`,
    params: {slug},
    variant,
  })

  return <article>{/* ... */}</article>
}
```

Passing `variant` as a prop is what keeps cached output correct. Two visitors in different variants get different cache entries.

When the editor switches variants in Presentation, `next-sanity` calls `refresh()` from `next/cache` to re-render with the new value. Variant switching does not use `revalidateTag`, `revalidatePath`, `updateTag`, `cacheTag`, or `cacheLife`, so it composes with whatever cache-tag strategy you already have.

`next-sanity` also exports `variantsApiVersion` if you'd rather not hardcode `X`.

## Sharing a preview

Share links from the Presentation tool carry the current variant, so a shared URL opens on the same variant the sender was looking at. Anyone opening it sees that variant's content, which makes review links useful for sign-off on personalized copy.

## Production considerations

Deciding a visitor's conditions is your frontend's job. Sanity doesn't do segmentation. Read them from your session, your auth provider, your feature-flag service, or your edge middleware, then pass them to the query as conditions.

```ts
const conditions = {
  audience: session.isReturning ? 'loyal' : 'new',
  market: geo.region,
}

const data = await client.fetch(query, params, {variant: conditions})
```

Two things to watch. Personalized responses vary by condition, so any HTTP cache in front of your frontend needs the conditions in its cache key or visitors will see each other's content. And in production paths prefer conditions over variant IDs, since a hardcoded ID breaks if someone deletes the definition. See [Querying variants](./06-querying-variants.md).
