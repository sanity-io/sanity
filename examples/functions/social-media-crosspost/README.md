# Social Media Crosspost Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to share their content across multiple social media platforms to maximize reach, but manually posting to each platform is time-consuming, error-prone, and often forgotten. Each platform has different character limits and formatting requirements, making it even more challenging to maintain consistent messaging.

## Solution

This Sanity Function automatically posts content to multiple social media platforms (X, Mastodon, Bluesky, LinkedIn, Discord, Telegram, Slack, and Dev.to) when a social post document is created. Using the `@humanwhocodes/crosspost` library, it handles platform-specific formatting, character limits, and authentication, allowing you to write once and publish everywhere from a single Sanity document.

## Benefits

- **Multi-platform distribution** - Post to any or all of 8 social networks simultaneously from one place
- **Platform-specific overrides** - Write one global post body, then override text for specific platforms when needed (with visual "Overridden" badges)
- **Real-time character validation** - Character count badges for each platform turn red when over limit, preventing publishing errors
- **Smart scheduling** - Use Content Releases to schedule posts in advance for coordinated launches
- **Automatic status tracking** - Track posting status and get links to published posts or error messages
- **Image support** - Attach a single image that works across all platforms with alt text (automatically optimized to 1440px width and best format)
- **Time savings** - Eliminate manual cross-posting and reduce the risk of missing platforms

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the schema to your project

This function includes a `socialPost` document type schema with a custom character counter component.

**Add the schema files to your Studio:**

1. Copy `socialPost.ts` to your Studio's schema types directory (e.g., `studio/schemaTypes/documents/`)
2. Copy `characterCount.tsx` to your components directory (e.g., `studio/schemaTypes/components/`)

3. Import and add the schema to your `sanity.config.ts`:

   ```ts
   import {socialPost} from './schemaTypes/documents/socialPost'

   export default defineConfig({
     // ... other config
     schema: {
       types: [
         // ... your existing types
         socialPost,
       ],
     },
   })
   ```

4. Install required dependencies in your Studio:

   ```bash
   cd studio  # or your Studio directory
   npm install @sanity/ui
   ```

5. Deploy your updated schema:

   ```bash
   cd studio
   npx sanity schema deploy
   ```

## Requirements

- A Sanity project with Sanity Functions enabled
- Node.js v22.x for local testing
- At least one social media platform account with API credentials

**Supported Platforms:** This function supports 8 platforms via the `@humanwhocodes/crosspost` library:

- **X (Twitter)** - Social media platform
- **Mastodon** - Decentralized social network
- **Bluesky** - Decentralized social network
- **LinkedIn** - Professional networking
- **Discord** - Via webhook URL (no bot setup required)
- **Telegram** - Messaging platform
- **Slack** - Team communication platform
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
     SLACK_BOT_TOKEN,
     SLACK_CHANNEL,
     DEVTO_API_KEY,
   } = process.env

   // Ensure environment variables are strings or provide defaults
   const crosspostEnvVars = {
     TWITTER_ACCESS_TOKEN_KEY: TWITTER_ACCESS_TOKEN_KEY || '',
     TWITTER_ACCESS_TOKEN_SECRET: TWITTER_ACCESS_TOKEN_SECRET || '',
     TWITTER_API_CONSUMER_KEY: TWITTER_API_CONSUMER_KEY || '',
     TWITTER_API_CONSUMER_SECRET: TWITTER_API_CONSUMER_SECRET || '',
     MASTODON_ACCESS_TOKEN: MASTODON_ACCESS_TOKEN || '',
     MASTODON_HOST: MASTODON_HOST || '',
     BLUESKY_IDENTIFIER: BLUESKY_IDENTIFIER || '',
     BLUESKY_PASSWORD: BLUESKY_PASSWORD || '',
     BLUESKY_HOST: BLUESKY_HOST || '',
     LINKEDIN_ACCESS_TOKEN: LINKEDIN_ACCESS_TOKEN || '',
     DISCORD_WEBHOOK_URL: DISCORD_WEBHOOK_URL || '',
     TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN || '',
     TELEGRAM_CHAT_ID: TELEGRAM_CHAT_ID || '',
     SLACK_BOT_TOKEN: SLACK_BOT_TOKEN || '',
     SLACK_CHANNEL: SLACK_CHANNEL || '',
     DEVTO_API_KEY: DEVTO_API_KEY || '',
   }

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
           projection: '{_id, body, mainImage, platforms, platformOverrides}',
         },
         env: crosspostEnvVars,
       }),
     ],
   })
   ```

4. **Install dependencies**

   Install dependencies in the project root and in the functions directory:

   ```bash
   # Install dependencies in the root
   npm install dotenv
   # Install in the functions directory
   cd functions/social-media-crosspost
   npm install
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

   # Slack
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_CHANNEL=your-channel-id

   # Dev.to
   DEVTO_API_KEY=your-api-key
   ```

   Only include credentials for platforms you want to use.

## Testing the function locally

> [!NOTE]
> Running tests will post to the social media accounts you have configured in your environment variables and test document/json. Use test accounts if you do not want to post live content to real audiences.

You can test the social-media-crosspost function locally using the Sanity CLI before deploying it to production.

### Test with data from a JSON file

Test the function with the included sample document:

```bash
npx sanity functions test social-media-crosspost --file functions/social-media-crosspost/document.json
```

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can:

- Select the `social-media-crosspost` function
- Feel free to paste JSON from `document.json` if you want to use the sample data, or create your own

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project

### Deploy to production

1. **Deploy your blueprint**

   From your project root, run:

   ```bash
   npx sanity blueprints deploy
   ```

   This command will:
   - Package your function code
   - Upload it to Sanity's infrastructure
   - Configure the event triggers for social post creation
   - Make your function live in production

2. **Optional: Add environment variables**

   If you did not use a `.env` file you can add your environment variables using the CLI after deployment:

   ```bash
   npx sanity functions env add social-media-crosspost MASTODON_ACCESS_TOKEN "your-token"
   npx sanity functions env add social-media-crosspost MASTODON_HOST "mastodon.social"
   ```

   You can verify the environment variables were added successfully:

   ```bash
   npx sanity functions env list social-media-crosspost
   ```

3. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Creating a new social post document and confirming it appears on your selected platforms
   - Checking the `status` field for links to published posts or error messages
   - Monitoring function logs in the Sanity CLI

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
2. In "Platform Overrides", add a platform-specific override
3. The character counter will show which platforms use custom text
4. The function will use the override for that platform and the global body for others

## Troubleshooting

### Common Issues

**Error: "No enabled strategies found"**

- Cause: Missing or incorrect environment variables for all selected platforms
- Solution: Verify your environment variables are correctly configured for at least one selected platform

**Error: "Authentication failed" for a platform**

- Cause: Invalid or expired API credentials
- Solution: Verify your credentials by checking the [setup guide](https://github.com/humanwhocodes/crosspost?tab=readme-ov-file#setting-up-strategies)

**Posts not appearing on social platforms**

- Cause: Function may have failed silently or credentials may be incorrect
- Solution: Check the `status` field on your social post document for error messages

### Platform-Specific Issues

**X (Twitter):**

- Requires both consumer keys and access tokens
- Verify your app has write permissions enabled
- Uses `TWITTER_*` environment variables (not `X_*`)

**Mastodon:**

- Specify your instance host (e.g., `mastodon.social`)
- Access token must have write permissions, and `write:media` to attach images

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

**Slack:**

- Bot token must start with `xoxb-`
- Bot needs `chat:write` and `files:write` scopes
- **Important:** `files:write` scope is required if attaching images - posts will fail with "missing_scope" error without it
- Bot must be invited to the channel before posting

**Dev.to:**

- API key must have write permissions
- Posts may require additional metadata for proper formatting
- At the time of testing this function, images were not working on Dev.to.

## Related Examples

- [Bluesky Post Function](../bluesky-post/README.md) – Post to Bluesky only
- [Mastodon Post Function](../mastodon-post/README.md) – Post to Mastodon
- [Slack Notification Function](../slack-notify/README.md) – Send notifications to Slack
- [Auto-Summary Function](../auto-summary/README.md) – Generate content summaries with AI
