# Mastodon Post Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams want to automatically share their published articles on Mastodon to reach decentralized social media audiences. Manually cross-posting to multiple social platforms is time-consuming and often forgotten, leading to missed opportunities for content promotion across the fediverse.

## Solution

This Sanity Function automatically posts to Mastodon when the `mastodonPost` field is changed using the `@humanwhocodes/crosspost` library. When the mastodonPost field of a post is updated, the function creates a Mastodon post containing the title, mastodonPost, and slug, helping maintain consistent presence across decentralized social networks.

## Benefits

- **Automates fediverse sharing** by posting to Mastodon on content publish
- **Saves time** by eliminating manual cross-posting tasks
- **Reaches decentralized audiences** by sharing on Mastodon instances
- **Ensures consistency** with automatic posting of title, mastodonPost, and link
- **Reduces missed opportunities** by automatically posting to Mastodon

## Requirements

- A schema with a `post` document type containing:
  - `title` field (string)
  - `mastodonPost` field (text or string)
  - `slug` field (slug type with `current` property)
- A Mastodon account on any instance
- Mastodon application with access token
- Node.js v22.x for local testing

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Schema Requirements

This function expects your post schema to include:

- `title` field (string)
- `mastodonPost` field (text) - for the post content
- `slug` field (slug type with `current` property)

Most official templates already include the `title` and `slug` fields, but you will need to add the `mastodonPost` field.

Add the `mastodonPost` field to your post schema:

```ts
defineField({
  name: 'mastodonPost',
  title: 'Mastodon Post Content',
  type: 'text',
  description: 'Content to post on Mastodon when this post is published',
})
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Set up Mastodon API Credentials**

   You'll need to create a Mastodon application and get an access token. There are two methods:
   1. **Log into your Mastodon instance:**
      - Go to your Mastodon instance (e.g., `mastodon.social`, `mastodon.online`, etc.)
      - Sign in with your account

   2. **Access Development Settings:**
      - Click Preferences
      - In the sidebar, click "Development"
      - Click "New Application"

   3. **Create Application:**
      - **Application name:** Give it a descriptive name (e.g., "Sanity Auto-Post")
      - **Application website:** Your website URL (optional)
      - **Redirect URI:** Leave as default (`urn:ietf:wg:oauth:2.0:oob`)
      - **Scopes:** Select `write:statuses` (required for posting)

   4. **Get Access Token:**
      - After creating the application, click on its name to view details
      - Copy the "Your access token" - this is what you'll use as `MASTODON_TOKEN`
      - Note your instance URL (e.g., `https://mastodon.social`) - this is your `MASTODON_HOST`

2. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example mastodon-post
   ```

3. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import 'dotenv/config'
   import process from 'node:process'
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   const {MASTODON_TOKEN, MASTODON_HOST} = process.env
   if (typeof MASTODON_TOKEN !== 'string' || typeof MASTODON_HOST !== 'string') {
     throw new Error('MASTODON_TOKEN and MASTODON_HOST must be set')
   }

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'mastodon-post',
         src: './functions/mastodon-post',
         memory: 1,
         timeout: 10,
         event: {
           on: ['create', 'update'],
           filter: "_type == 'post' && delta::changedAny(mastodonPost)",
           projection: '{title, mastodonPost, slug}',
         },
         env: {
           MASTODON_TOKEN: MASTODON_TOKEN,
           MASTODON_HOST: MASTODON_HOST,
         },
       }),
     ],
   })
   ```

4. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install dotenv
   ```

5. **Configure environment variables**

   Create a `.env` file in your project root with the following variables:

   ```env
   # Required
   MASTODON_TOKEN=your-access-token-here
   MASTODON_HOST=https://your-instance.com

   # Examples:
   # MASTODON_HOST=https://mastodon.social
   # MASTODON_HOST=https://mastodon.online
   # MASTODON_HOST=https://fosstodon.org
   ```

   **Required:**
   - `MASTODON_TOKEN`: Your Mastodon application access token
   - `MASTODON_HOST`: Your Mastodon instance URL (including https://)

## Testing the function locally

You can test the mastodon-post function locally using the Sanity CLI before deploying it to production.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test mastodon-post --document-id <insert-document-id> --dataset production --with-user-token
```

### Test with data from a JSON file

Test the function with the included sample document:

```bash
npx sanity functions test mastodon-post --file functions/mastodon-post/document.json
```

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### Testing Tips

- **Warning: Live posting** - The function will actually post to Mastodon when tested locally
- **Use real credentials** - You still need valid Mastodon credentials for testing the authentication
- **Check logs** - Monitor console output to see the post content that would be sent
- **Test different instances** - Verify your credentials work with your specific Mastodon instance
- **Test edge cases** - Try documents without summaries or slugs to ensure graceful handling

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)
- Valid Mastodon credentials (access token and instance host)

### Deploy to production

1. **Verify your blueprint configuration**

   Make sure your `sanity.blueprint.ts` file is properly configured with your function as shown in the implementation section above.

2. **Deploy your blueprint**

   From your project root, run:

   ```bash
   npx sanity blueprints deploy
   ```

   This command will:
   - Package your function code and .env file
   - Upload it to Sanity's infrastructure
   - Configure the event triggers for mastodonPost field changes
   - Make your mastodon-post function live in production

3. **If you're not using a .env file - Add environment variables**

   After deployment, only if you're not using an .env file, you need to add your Mastodon credentials as environment variables:

   ```bash
   npx sanity functions env add mastodon-post MASTODON_TOKEN "your-access-token-here"
   npx sanity functions env add mastodon-post MASTODON_HOST "https://your-instance.com"
   ```

   You can verify the environment variables were added successfully:

   ```bash
   npx sanity functions env list mastodon-post
   ```

4. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Updating the mastodonPost field of a post and confirming it appears on Mastodon
   - Monitoring function logs in the CLI

## Customization

### Add conditional posting

Only post when mastodonPost changes and `postToMastodon` is set to true:

```ts
filter: "_type == 'post' && delta::changedAny(mastodonPost) && postToMastodon == true)"
```

### Include additional fields

Add more fields to the projection and use them in the post:

```ts
projection: '{title, mastodonPost, slug, author, tags}'
```

### Add hashtags based on content

```ts
const hashtags = data.tags?.map((tag) => `#${tag}`).join(' ') || ''
const postContent = `${title}

${mastodonPost}

${slug.current}

${hashtags}`
```

## Related Examples

- [Bluesky Post Function](../bluesky-post/README.md) – Cross-post to Bluesky
- [Slack Notification Function](../slack-notify/README.md) – Send notifications to Slack
- [Auto-Summary Function](../auto-summary/README.md) – Generate summaries for content
