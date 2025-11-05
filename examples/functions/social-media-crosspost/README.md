# Social Media Crosspost Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to share their content across multiple social media platforms to maximize reach, but manually posting to each platform is time-consuming, error-prone, and often forgotten. Each platform has different character limits and formatting requirements, making it even more challenging to maintain consistent messaging.

## Solution

This Sanity Function automatically posts content to multiple social media platforms (Bluesky, LinkedIn, X, and more) when a social post document is created. Using the `@humanwhocodes/crosspost` library, it handles platform-specific formatting, character limits, and authentication, allowing you to write once and publish everywhere from a single Sanity document.

## Benefits

- **Multi-platform distribution** - Post to multiple social networks simultaneously from one place
- **Platform-specific customization** - Override post content for specific platforms when needed
- **Character limit validation** - Real-time character counts prevent over-limit posts before publishing
- **Smart scheduling** - Use Content Releases to schedule posts in advance for coordinated launches
- **Automatic status tracking** - Track posting status and get links to published posts or error messages
- **Image support** - Attach a single image that works across all platforms with alt text
- **Time savings** - Eliminate manual cross-posting and reduce the risk of missing platforms

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the schema to your project

This function includes a complete `socialPost` document schema with custom UI components. You'll need to add it to your Sanity Studio:

1. Copy `schema-socialPost.ts` to your schema directory (e.g., `studio/schemaTypes/`)
2. Copy `components/characterCount.tsx` to your components directory (e.g., `studio/components/`)
3. Import and add the schema to your studio configuration:

```typescript
// studio/schemaTypes/index.ts
import {socialPost} from './socialPost'

export const schemaTypes = [
  // ... your other schemas
  socialPost,
]
```

4. Install required UI dependencies in your studio folder:

```bash
cd studio
npm install @sanity/ui react
cd ..
```

5. Deploy your updated schema:

```bash
# From the studio/ folder
cd studio
npx sanity schema deploy
cd ..
```

## Requirements

- A Sanity project with Sanity Functions enabled
- Node.js v22.x for local testing
- At least one social media platform account with API credentials

**Supported Platforms:** This function supports 7 platforms via the `@humanwhocodes/crosspost` library:

- **X (Twitter)** - Social media platform
- **Mastodon** - Decentralized social network
- **Bluesky** - Decentralized social network
- **LinkedIn** - Professional networking
- **Discord** - Via webhook URL (no bot setup required)
- **Telegram** - Messaging platform
- **Dev.to** - Developer blogging platform

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Set up platform credentials**

   You'll need API credentials for each platform you want to post to. Follow the detailed setup instructions in the crosspost library documentation:

   **[View credential setup instructions for all platforms →](https://github.com/humanwhocodes/crosspost?tab=readme-ov-file#setting-up-strategies)**

2. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example social-media-crosspost
   ```

3. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import 'dotenv/config'
   import process from 'node:process'
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   // Extract environment variables for platforms you want to use
   const {
     TWITTER_ACCESS_TOKEN_KEY,
     TWITTER_ACCESS_TOKEN_SECRET,
     TWITTER_API_CONSUMER_KEY,
     TWITTER_API_CONSUMER_SECRET,
     MASTODON_ACCESS_TOKEN,
     MASTODON_HOST,
     BLUESKY_IDENTIFIER,
     BLUESKY_PASSWORD,
     BLUESKY_HOST,
     LINKEDIN_ACCESS_TOKEN,
     DISCORD_WEBHOOK_URL,
     TELEGRAM_BOT_TOKEN,
     TELEGRAM_CHAT_ID,
     DEVTO_API_KEY,
   } = process.env

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'social-media-crosspost',
         src: './functions/social-media-crosspost',
         memory: 2,
         timeout: 30,
         event: {
           on: ['create'],
           filter: "_type == 'socialPost'",
           projection: '{_id, body, mainImage, platforms, platformSettings}',
         },
         env: {
           TWITTER_ACCESS_TOKEN_KEY,
           TWITTER_ACCESS_TOKEN_SECRET,
           TWITTER_API_CONSUMER_KEY,
           TWITTER_API_CONSUMER_SECRET,
           MASTODON_ACCESS_TOKEN,
           MASTODON_HOST,
           BLUESKY_IDENTIFIER,
           BLUESKY_PASSWORD,
           BLUESKY_HOST,
           LINKEDIN_ACCESS_TOKEN,
           DISCORD_WEBHOOK_URL,
           TELEGRAM_BOT_TOKEN,
           TELEGRAM_CHAT_ID,
           DEVTO_API_KEY,
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

   Create a `.env` file in your project root with your platform credentials:

   ```env
   # X (Twitter)
   TWITTER_ACCESS_TOKEN_KEY=your-access-token
   TWITTER_ACCESS_TOKEN_SECRET=your-access-secret
   TWITTER_API_CONSUMER_KEY=your-consumer-key
   TWITTER_API_CONSUMER_SECRET=your-consumer-secret

   # Mastodon
   MASTODON_ACCESS_TOKEN=your-access-token
   MASTODON_HOST=mastodon.social

   # Bluesky
   BLUESKY_IDENTIFIER=yourname.bsky.social
   BLUESKY_PASSWORD=xxxx-xxxx-xxxx-xxxx
   BLUESKY_HOST=bsky.social

   # LinkedIn
   LINKEDIN_ACCESS_TOKEN=your-linkedin-token

   # Discord
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

   # Telegram
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id

   # Dev.to
   DEVTO_API_KEY=your-api-key
   ```

   Only include credentials for platforms you want to use.

## Testing the function locally

You can test the social-media-crosspost function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset.

### Simple Testing Command

Test the function with an existing social post document from your dataset:

```bash
npx sanity functions test social-media-crosspost --document-id <insert-document-id> --dataset production --with-user-token
```

### Test with data from a JSON file

First, create a test social post document in your dataset:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/social-media-crosspost/document.json --replace
cd ..
```

Then test the function with the created document:

```bash
npx sanity functions test social-media-crosspost --file functions/social-media-crosspost/document.json
```

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### Testing Tips

- **Use real credentials** - You need valid API credentials for each platform you want to test
- **Warning: Live posting** - The function will actually post to social platforms when tested locally
- **Check logs** - Monitor console output to see posting status for each platform
- **Test character limits** - Try posts that exceed platform limits to see validation in action
- **Test platform overrides** - Try overriding the body for specific platforms
- **Use Node.js v22.x** locally to match production runtime

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)
- Valid API credentials for at least one platform

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
   - Configure the event triggers for social post creation
   - Make your function live in production

3. **Add environment variables**

   After deployment, you need to add your platform credentials as environment variables. Only add credentials for platforms you want to use:

   ```bash
   # X/Twitter (if using)
   npx sanity functions env add social-media-crosspost TWITTER_ACCESS_TOKEN_KEY "your-key"
   npx sanity functions env add social-media-crosspost TWITTER_ACCESS_TOKEN_SECRET "your-secret"
   npx sanity functions env add social-media-crosspost TWITTER_API_CONSUMER_KEY "your-consumer-key"
   npx sanity functions env add social-media-crosspost TWITTER_API_CONSUMER_SECRET "your-consumer-secret"

   # Mastodon (if using)
   npx sanity functions env add social-media-crosspost MASTODON_ACCESS_TOKEN "your-token"
   npx sanity functions env add social-media-crosspost MASTODON_HOST "mastodon.social"

   # Bluesky (if using)
   npx sanity functions env add social-media-crosspost BLUESKY_IDENTIFIER "yourname.bsky.social"
   npx sanity functions env add social-media-crosspost BLUESKY_PASSWORD "xxxx-xxxx-xxxx-xxxx"
   npx sanity functions env add social-media-crosspost BLUESKY_HOST "bsky.social"

   # LinkedIn (if using)
   npx sanity functions env add social-media-crosspost LINKEDIN_ACCESS_TOKEN "your-token"

   # Discord (if using)
   npx sanity functions env add social-media-crosspost DISCORD_WEBHOOK_URL "https://discord.com/api/webhooks/..."

   # Telegram (if using)
   npx sanity functions env add social-media-crosspost TELEGRAM_BOT_TOKEN "your-bot-token"
   npx sanity functions env add social-media-crosspost TELEGRAM_CHAT_ID "your-chat-id"

   # Dev.to (if using)
   npx sanity functions env add social-media-crosspost DEVTO_API_KEY "your-api-key"
   ```

   You can verify the environment variables were added successfully:

   ```bash
   npx sanity functions env list social-media-crosspost
   ```

4. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Creating a new social post document and confirming it appears on your selected platforms
   - Checking the `status` field for links to published posts or error messages
   - Monitoring function logs in the Sanity CLI

## Usage Example

When you create a new social post document, the function automatically:

1. **Validates the content** - Checks that your post body doesn't exceed character limits for selected platforms
2. **Authenticates with platforms** - Uses your configured credentials for each selected platform
3. **Posts to each platform** - Sends your content (and optional image) to all selected platforms simultaneously
4. **Updates status field** - Adds links to published posts or error messages to the document's `status` field

### Pro Tip: Schedule Posts with Content Releases

Use Sanity's Content Releases feature to schedule posts in advance! Draft your social posts and bundle them into a scheduled release for coordinated multi-platform launches.

### Character Count Features

The schema includes a real-time character counter that:

- Shows character count for each selected platform
- Turns red when you exceed a platform's limit
- Indicates when you've overridden the body for specific platforms
- Prevents publishing if any platform exceeds its character limit

### Platform-Specific Overrides

You can override the global post body for specific platforms:

1. Write your main post in the "Body" field
2. In "Platform Settings", add a platform-specific override
3. The character counter will show which platforms use custom text
4. The function will use the override for that platform and the global body for others

## Customization

### Change which platforms to post to

Modify the filter in your blueprint to only trigger for specific platform combinations:

```ts
filter: "_type == 'socialPost' && 'bluesky' in platforms"
```

### Trigger on document updates

Change the event trigger to also post when documents are updated:

```ts
event: {
  on: ['create', 'update'],
  filter: "_type == 'socialPost' && delta::changedAny(body, platforms, platformSettings)",
  projection: '{_id, body, mainImage, platforms, platformSettings}',
}
```

### Add more image support

The current implementation supports a single image. To add multiple images, you'll need to update:

1. The schema to support an array of images
2. The function to map images to each platform's requirements

### Extend to more platforms

The `@humanwhocodes/crosspost` library may add support for more platforms over time. To add new platforms:

1. Update the `createStrategies` function in `index.ts`
2. Add the required environment variables
3. Update the documentation

## Troubleshooting

### Common Issues

**Error: "No enabled strategies found"**

- Cause: Missing or incorrect environment variables for all selected platforms
- Solution: Verify your environment variables are correctly configured for at least one selected platform

**Error: "Authentication failed" for a platform**

- Cause: Invalid or expired API credentials
- Solution: Verify your credentials by checking the [setup guide](https://github.com/humanwhocodes/crosspost?tab=readme-ov-file#setting-up-strategies)

**Error: "Failed to fetch image"**

- Cause: Image asset reference is invalid or image is not accessible
- Solution: Ensure the image exists in your dataset and the asset reference is correct

**Posts not appearing on social platforms**

- Cause: Function may have failed silently or credentials may be incorrect
- Solution: Check the `status` field on your social post document for error messages

**Character count validation failing**

- Cause: Post body exceeds character limit for one or more selected platforms
- Solution: Either shorten the global body or add platform-specific overrides with shorter text

**Function not triggering**

- Cause: Blueprint filter or event configuration issues
- Solution: Verify the filter matches your document structure and that you're creating (not updating) documents

### Platform-Specific Issues

**X (Twitter):**

- Requires both consumer keys and access tokens
- Verify your app has write permissions enabled
- Uses `TWITTER_*` environment variables (not `X_*`)

**Mastodon:**

- Specify your instance host (e.g., `mastodon.social`)
- Access token must have write permissions

**Bluesky:**

- Ensure you're using an app password, not your account password
- App passwords are in format `xxxx-xxxx-xxxx-xxxx`
- Use `BLUESKY_IDENTIFIER` (not `BLUESKY_USERNAME`)

**LinkedIn:**

- OAuth tokens expire - you may need to refresh them periodically
- Check token scopes include posting permissions

**Discord:**

- Use webhook URL, not bot token
- Webhook URL format: `https://discord.com/api/webhooks/...`
- No bot setup or permissions required

**Telegram:**

- Bot must be added to the channel/chat
- Chat ID can be negative for groups/channels

**Dev.to:**

- API key must have write permissions
- Posts may require additional metadata for proper formatting

## Related Examples

- [Bluesky Post Function](../bluesky-post/README.md) – Post to Bluesky only
- [Mastodon Post Function](../mastodon-post/README.md) – Post to Mastodon
- [Slack Notification Function](../slack-notify/README.md) – Send notifications to Slack
- [Auto-Summary Function](../auto-summary/README.md) – Generate content summaries with AI
