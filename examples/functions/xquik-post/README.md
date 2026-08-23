# Xquik Post Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Publishing an X post is an external side effect. A retried Function must not create a duplicate.
Ambiguous API responses also need a durable status before another attempt is safe.

## Solution

This Sanity Function posts approved content through the Xquik Twitter post API. It derives a
stable idempotency key from the document revision and payload. It then polls the durable write
action until X confirms success or failure.

The Function can attach one Sanity image. It stores the final post URL and write action status on
the source document.

## Benefits

- Prevent duplicate posts when the same Function invocation runs again
- Require an editor to enable `postToX` before the first publish
- Attach a public Sanity image without a separate upload
- Track pending, successful, and failed writes on the document
- Resume an ambiguous write through its durable action instead of posting again

## Requirements

- A Sanity project with Sanity Functions enabled
- Node.js v24.x for local testing
- An Xquik API key with an X account connected
- Enough Xquik credits for the post and any attached media

Xquik writes require a connected X account. Public scraping credentials alone cannot publish.

## Add the schema fields

Copy `schema.ts` into your Studio. Spread `xquikPostFields` into your existing `post` document:

```ts
import {defineType} from 'sanity'

import {xquikPostFields} from './xquikPostFields'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    // Your existing fields
    ...xquikPostFields,
  ],
})
```

The included projection expects an image field named `mainImage`. Change the projection if your
schema uses another name.

## Install the Function

Run these commands from your project root:

```bash
npx sanity blueprints init
npx sanity blueprints add function --example xquik-post
cd functions/xquik-post
npm install
```

Add the resource to `sanity.blueprint.ts`:

```ts
import 'dotenv/config'
import process from 'node:process'

import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

const {X_TWITTER_SCRAPER_API_KEY, XQUIK_ACCOUNT} = process.env

if (!X_TWITTER_SCRAPER_API_KEY || !XQUIK_ACCOUNT) {
  throw new Error('X_TWITTER_SCRAPER_API_KEY and XQUIK_ACCOUNT must be set')
}

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'xquik-post',
      src: './functions/xquik-post',
      memory: 1,
      timeout: 60,
      event: {
        on: ['create'],
        filter: "_type == 'post' && postToX == true && defined(xPost)",
        projection: '{_id, _rev, xPost, "imageUrl": mainImage.asset->url}',
      },
      env: {
        X_TWITTER_SCRAPER_API_KEY,
        XQUIK_ACCOUNT,
      },
    }),
  ],
})
```

Set `XQUIK_ACCOUNT` to the connected X username or account ID. Keep the API key out of source
control.

## Test locally

Run the unit tests first:

```bash
cd functions/xquik-post
npm run typecheck
npm test
```

Then test the Function from the project root:

```bash
npx sanity functions test xquik-post \
  --file functions/xquik-post/document.json \
  --dataset production \
  --with-user-token
```

> [!WARNING]
> This command creates a live X post. Use a test account and disposable content.

Local mode skips the `xPostStatus` document patch. It still sends the X post.

## Deploy

Deploy the Blueprint, then set both Function environment variables:

```bash
npx sanity blueprints deploy
npx sanity functions env add xquik-post X_TWITTER_SCRAPER_API_KEY "your-api-key"
npx sanity functions env add xquik-post XQUIK_ACCOUNT "your-connected-account"
```

Verify the deployment:

1. Create a `post` document.
2. Write the `xPost` text.
3. Enable `postToX`.
4. Publish the document once.
5. Check `xPostStatus` for the confirmed URL.

The default trigger runs only when a new published `post` document is created. Use a dedicated
social post document if one content item needs several X posts.

## Retry behavior

The Function uses the document ID, revision, account, text, and image URL to derive one
idempotency key. Re-running the same payload returns the original write action. A changed revision
gets a new key.

The Function polls pending actions for up to 50 seconds. If the action remains pending, inspect its
stored `writeActionId` before changing the payload or starting another write.

See the published [Create Tweet API](https://docs.xquik.com/api-reference/x-write/create-tweet) and
[TypeScript SDK guide](https://docs.xquik.com/sdks/typescript) for response fields and recovery
rules.

## Security

- Store the API key only in Function environment variables.
- Grant the key only the scopes this workflow needs.
- Treat a logged or committed key as compromised and rotate it.
- Keep `postToX` false until an editor approves the final text.
- Use only public HTTPS media URLs.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are
trademarks of X Corp.
