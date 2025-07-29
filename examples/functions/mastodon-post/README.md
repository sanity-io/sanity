# Mastodon Post Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams want to automatically share their published articles on Mastodon to reach decentralized social media audiences. Manually cross-posting to multiple social platforms is time-consuming and often forgotten, leading to missed opportunities for content promotion across the fediverse.

## Solution

This Sanity Function automatically posts to Mastodon when content is published using the `@humanwhocodes/crosspost` library. When a post is published, the function creates a Mastodon post containing the title, summary, and slug, helping maintain consistent presence across decentralized social networks.

## Benefits

- **Automates fediverse sharing** by posting to Mastodon on content publish
- **Saves time** by eliminating manual cross-posting tasks
- **Reaches decentralized audiences** by sharing on Mastodon instances
- **Ensures consistency** with automatic posting of title, summary, and link
- **Reduces missed opportunities** by never forgetting to share published content

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Schema Requirements

This function expects your post schema to include:

- `title` field (string)
- `autoSummary` field (text) - for the post description
- `slug` field (slug type with `current` property)

Most official templates already include these fields, but you may need to add the `autoSummary` field.

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Set up Mastodon API Credentials**

   You'll need to create a Mastodon application and get an access token. There are two methods:

   ### Method 1: Web Interface (Recommended)
   1. **Log into your Mastodon instance:**
      - Go to your Mastodon instance (e.g., `mastodon.social`, `mastodon.online`, etc.)
      - Sign in with your account

   2. **Access Development Settings:**
      - Click your profile picture → Preferences (or Settings)
      - In the sidebar, click "Development"
      - Click "New Application"

   3. **Create Application:**
      - **Application name:** Give it a descriptive name (e.g., "Sanity Auto-Post")
      - **Application website:** Your website URL (optional)
      - **Redirect URI:** Leave as default (`urn:ietf:wg:oauth:2.0:oob`)
      - **Scopes:** Select `read` and `write` (required for posting)

   4. **Get Access Token:**
      - After creating the application, click on its name to view details
      - Copy the "Your access token" - this is what you'll use as `MASTODON_TOKEN`
      - Note your instance URL (e.g., `https://mastodon.social`) - this is your `MASTODON_HOST`

   ### Method 2: Programmatic Registration

   If you prefer to register programmatically, you can use the Mastodon API:

   ```bash
   # Register application
   curl -X POST https://your-instance.com/api/v1/apps \
     -F 'client_name=Sanity Auto-Post' \
     -F 'redirect_uris=urn:ietf:wg:oauth:2.0:oob' \
     -F 'scopes=read write'

   # This returns client_id and client_secret
   # Then get access token with these credentials
   ```

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
           on: ['publish'],
           filter: "_type == 'post'",
           projection: '_id, title, autoSummary, slug',
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

**Important:** This function requires valid Mastodon credentials but will NOT post to Mastodon during local testing. It will only log the content that would be posted.

### 1. Basic Function Test

Test the function with the included sample document:

```bash
npx sanity functions test mastodon-post \
  --file functions/mastodon-post/document.json \
  --dataset production \
  --with-user-token
```

### 2. Test with Real Document Data

Test with a real document from your dataset:

```bash
# From the studio/ folder, export a real document for testing
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../real-post.json

# Back to project root for function testing
cd ..
npx sanity functions test mastodon-post \
  --file real-post.json \
  --dataset production \
  --with-user-token
```

### 3. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### Testing Tips

- **Local testing safety** - The function detects local testing and won't actually post to Mastodon
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
   - Package your function code
   - Upload it to Sanity's infrastructure
   - Configure the event triggers for post publications
   - Make your mastodon-post function live in production

3. **Add environment variables**

   After deployment, you need to add your Mastodon credentials as environment variables:

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
   - Checking the Sanity Studio under "Compute"
   - Publishing a new post and confirming it appears on Mastodon
   - Monitoring function logs in the CLI

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - `title` field (string)
  - `autoSummary` field (text or string)
  - `slug` field (slug type with `current` property)
- A Mastodon account on any instance
- Mastodon application with access token
- Node.js v22.x for local testing

## Usage Example

When you publish a post document, the function automatically:

1. Extracts the post title, auto-summary, and slug
2. Formats a social media post with this content
3. Posts to your Mastodon instance using your access token
4. Logs the success or any errors

**Example Mastodon post:**

```text
Getting Started with Sanity

Learn how to build amazing content experiences with Sanity's headless CMS. This guide covers everything from setup to deployment.

getting-started-with-sanity
```

## Customization

### Change post format

Modify the `postContent` template in `index.ts`:

```typescript
const postContent = `🚀 ${title}

${autoSummary}

🔗 Read more: ${slug.current}

#sanity #cms #webdev`
```

### Add conditional posting

Only post certain types of content by updating the filter:

```typescript
filter: "_type == 'post' && defined(publishedAt)"
```

### Include additional fields

Add more fields to the projection and use them in the post:

```typescript
projection: '_id, title, autoSummary, slug, author, tags'
```

### Add hashtags based on content

```typescript
const hashtags = data.tags?.map((tag) => `#${tag}`).join(' ') || ''
const postContent = `${title}

${autoSummary}

${slug.current}

${hashtags}`
```

## Troubleshooting

### Common Issues

**Error: "Unauthorized" or "Invalid access token"**

- Cause: Invalid or expired Mastodon access token
- Solution: Regenerate your access token in your Mastodon application settings

**Error: "Missing environment variable MASTODON_TOKEN"**

- Cause: Environment variables not set properly
- Solution: Ensure all required environment variables are configured

**Error: "Host not found" or network errors**

- Cause: Incorrect MASTODON_HOST or network connectivity issues
- Solution: Verify your instance URL is correct and includes `https://`

**Error: "Post content too long"**

- Cause: Combined content exceeds Mastodon's character limit (usually 500 characters)
- Solution: Truncate the auto-summary or modify the post format

**Posts not appearing on Mastodon**

- Cause: Authentication issues, network problems, or instance downtime
- Solution: Check your credentials, network connectivity, and instance status

**Function not triggering**

- Cause: Blueprint filter or event configuration issues
- Solution: Verify the filter matches your document structure and the event is set to 'publish'

**Error: "Insufficient permissions"**

- Cause: Access token doesn't have write permissions
- Solution: Ensure your Mastodon application has `write` scope enabled

## Mastodon Instance Considerations

### Popular Instances

- `mastodon.social` - General purpose, largest instance
- `mastodon.online` - General purpose, well-moderated
- `fosstodon.org` - Focus on free and open source software
- `mas.to` - General purpose, privacy-focused
- `hachyderm.io` - Tech and security focused

### Instance-Specific Settings

Some Mastodon instances may have:

- Different character limits (some allow more than 500 characters)
- Specific content policies
- Different API rate limits

Make sure your content complies with your instance's community guidelines.

## Related Examples

- [Bluesky Post Function](../bluesky-post/README.md) – Cross-post to Bluesky
- [Slack Notification Function](../slack-notify/README.md) – Send notifications to Slack
- [Auto-Summary Function](../auto-summary/README.md) – Generate summaries for content
