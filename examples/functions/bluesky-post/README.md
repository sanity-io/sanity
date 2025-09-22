# Bluesky Post Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams want to automatically share their published articles on Bluesky to increase reach and engagement. Manually cross-posting to social platforms is time-consuming and often forgotten, leading to missed opportunities for content promotion.

## Solution

This Sanity Function automatically posts to Bluesky when the `blueskyPost` field is changed using the `@humanwhocodes/crosspost` library. When a post's `blueskyPost` field is updated, the function creates a Bluesky post containing the title, summary, and slug, helping maintain consistent social media presence without manual effort.

## Benefits

- **Automates social media sharing** by posting to Bluesky
- **Saves time** by eliminating manual cross-posting tasks
- **Ensures consistency** with automatic posting of title, summary, and link
- **Increases content reach** by maintaining active social media presence
- **Reduces missed opportunities** by never forgetting to share published content

## Requirements

- A schema with a `post` document type containing:
  - `title` field (string)
  - `blueskyPost` field (text or string)
  - `slug` field (slug type with `current` property)
- A Bluesky account with app password
- Node.js v22.x for local testing

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Schema Requirements

This function expects your post schema to include:

- `title` field (string)
- `blueskyPost` field (text) - for the post content
- `slug` field (slug type with `current` property)

Most official templates already include the `title` and `slug` fields, but you will need to add the `blueskyPost` field.

Add the `blueskyPost` field to your post schema:

```ts
defineField({
  name: 'blueskyPost',
  title: 'Bluesky Post Content',
  type: 'text',
  description: 'Content to post on Bluesky when this post is published',
})
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Set up Bluesky Credentials**

   First, you'll need to create a Bluesky app password for API access:
   1. **Log into your Bluesky account:**
      - Go to [bsky.app](https://bsky.app) and sign in with your account

   2. **Create an App Password:**
      - Navigate to Settings → Privacy and Security → App Passwords
      - Or go directly to [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords)
      - Click "Add App Password"
      - Give it a descriptive name (e.g., "Sanity Auto-Post")
      - Click "Create App Password"

   3. **Save your credentials:**
      - **Username:** Your full Bluesky handle (e.g., `yourname.bsky.social`)
      - **App Password:** The generated password in format `xxxx-xxxx-xxxx-xxxx`
      - **Host:** Usually `bsky.social` (default)

   **Important:** App passwords have the same abilities as your account password but are restricted from destructive actions like account deletion. Store them securely.

2. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example bluesky-post
   ```

3. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import 'dotenv/config'
   import process from 'node:process'
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   const {BLUESKY_USERNAME, BLUESKY_PASSWORD, BLUESKY_HOST} = process.env
   if (typeof BLUESKY_USERNAME !== 'string' || typeof BLUESKY_PASSWORD !== 'string') {
     throw new Error('BLUESKY_USERNAME and BLUESKY_PASSWORD must be set')
   }

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'bluesky-post',
         src: './functions/bluesky-post',
         memory: 1,
         timeout: 10,
         event: {
           on: ['create', 'update'],
           filter: "_type == 'post' && delta::changedAny(blueskyPost)",
           projection: '{title, blueskyPost, slug}',
         },
         env: {
           BLUESKY_USERNAME: BLUESKY_USERNAME,
           BLUESKY_PASSWORD: BLUESKY_PASSWORD,
           BLUESKY_HOST: BLUESKY_HOST || 'bsky.social',
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
   BLUESKY_USERNAME=yourname.bsky.social
   BLUESKY_PASSWORD=xxxx-xxxx-xxxx-xxxx

   # Optional (defaults shown)
   BLUESKY_HOST=bsky.social
   ```

   **Required:**
   - `BLUESKY_USERNAME`: Your full Bluesky handle (e.g., `yourname.bsky.social`)
   - `BLUESKY_PASSWORD`: Your Bluesky app password (19 characters with dashes)

   **Optional:**
   - `BLUESKY_HOST`: Bluesky instance host (default: 'bsky.social')

## Testing the function locally

You can test the bluesky-post function locally using the Sanity CLI before deploying it to production.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test bluesky-post --document-id <insert-document-id> --dataset production --with-user-token
```

### Test with data from a JSON file

Test the function with the included sample document:

```bash
npx sanity functions test bluesky-post --file functions/bluesky-post/document.json
```

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### Testing Tips

- **Use real credentials** - You need valid Bluesky credentials for testing the authentication
- **Warning: Live posting** - The function will actually post to Bluesky when tested locally
- **Check logs** - Monitor console output to see the post content that was sent
- **Test edge cases** - Try documents without summaries or slugs to ensure graceful handling

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)
- Valid Bluesky credentials (username and app password)

### Deploy to production

1. **Verify your blueprint configuration**

   Make sure your `sanity.blueprint.ts` file is properly configured with your function as shown in the implementation section above.

2. **Deploy your blueprint**

   From your project root, run:

   ```bash
   npx sanity blueprints deploy
   ```

   This command will:
   - Package your function code
   - Upload it to Sanity's infrastructure
   - Configure the event triggers on `blueskyPost` field changes
   - Make your bluesky-post function live in production

3. **Add environment variables**

   After deployment, you need to add your Bluesky credentials as environment variables:

   ```bash
   npx sanity functions env add bluesky-post BLUESKY_USERNAME "yourname.bsky.social"
   npx sanity functions env add bluesky-post BLUESKY_PASSWORD "xxxx-xxxx-xxxx-xxxx"
   npx sanity functions env add bluesky-post BLUESKY_HOST "bsky.social"
   ```

   You can verify the environment variables were added successfully:

   ```bash
   npx sanity functions env list bluesky-post
   ```

4. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Updating the `blueskyPost` field on a post and confirming it appears on Bluesky
   - Monitoring function logs in the CLI

## Customization

### Change post format

Modify the `postContent` template in `index.ts`:

```ts
const postContent = `🚀 ${title}

${blueskyPost}

Read more: ${slug.current}`
```

### Add conditional posting

Only post when the `postToBlue` field is set to true:

```ts
filter: "_type == 'post' && delta::changedAny(blueskyPost) && postToBluesky == true"
```

### Include additional fields

Add more fields to the projection and use them in the post:

```ts
projection: '{title, blueskyPost, slug, author}'
```

## Troubleshooting

### Common Issues

**Error: "Authentication failed"**

- Cause: Invalid Bluesky credentials or expired app password
- Solution: Verify your username and app password are correct

**Error: "Missing environment variable BLUESKY_USERNAME"**

- Cause: Environment variables not set properly
- Solution: Ensure all required environment variables are configured

**Error: "Post content too long"**

- Cause: Combined title, post content, and slug exceed Bluesky's character limit
- Solution: Truncate the bluesky post content or modify the post format

**Posts not appearing on Bluesky**

- Cause: Authentication issues or network problems
- Solution: Check your Bluesky credentials and network connectivity

**Function not triggering**

- Cause: Blueprint filter or event configuration issues
- Solution: Verify the filter matches your document structure and that the `blueskyPost` field is being changed

## Related Examples

- [Mastodon Post Function](../mastodon-post/README.md) – Cross-post to Mastodon
- [Slack Notification Function](../slack-notify/README.md) – Send notifications to Slack
- [Auto-Summary Function](../auto-summary/README.md) – Generate summaries for content
