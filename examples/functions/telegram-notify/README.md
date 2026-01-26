# Telegram notifications when comments are submitted

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content authors need to respond quickly to comments on their content.

## Solution

This Sanity Function sends a Telegram notification when a comment is posted, with a helpful link to open the comment in your Sanity Studio.

## Benefits

- **Simplifies content operations** by providing a one-click way to enter the Studio
- **Improves content velocity** by allowing authors to respond to comments quickly

## Requirements

- A Sanity project with Functions enabled
- A schema with a `comment` document type containing:
  - A `comment` field (`string` or `text`) for storing the comment content
- Node.js v22.x for local development

### Schema Requirements

This function expects your schema to include a `comment` document type with:

- **`comment` field** - A `string` or `text` field containing the comment content
- The document type must be named `comment`

Example schema definition:

```ts
import {defineType} from 'sanity'

export const comment = defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    {
      name: 'comment',
      title: 'Comment',
      type: 'text', // or 'string'
      validation: (rule) => rule.required(),
    },
    // Add other fields as needed
  ],
})
```

## Usage Example

When a new `comment` type document is created, the function automatically:

1. **Triggers** on the on create event for `comment` type documents
2. **Checks** if the `comment` field is defined (using filter)
3. **Sends** a Telegram notification with a link to the comment in the Sanity Studio

**Result:** Content authors get a notification with a link to the comment in the Sanity Studio.

## Implementation

1. **Get your Telegram bot token**

Visit [https://core.telegram.org/bots#how-do-i-create-a-bot](https://core.telegram.org/bots) for more information.

- Message `/newbot` to [@BotFather on Telegram](https://t.me/botfather) to register your bot and receive its authentication token.
- Give your bot a name (e.g., "Sanity Content Notifications")
- Copy the bot token

2. **Get your Telegram chat ID**

- Open a chat with your bot in Telegram
- Send any message to your bot
- Open the following URL in your browser, replacing `<YOUR_BOT_TOKEN>` with your bot token

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

The response will be a JSON object containing your Chat ID.

3. **Prepare your environment variables**

- Create a `.env` file in the root of your project
- Add your bot token and chat ID to the `.env` file

```env
TELEGRAM_BOT_TOKEN=<YOUR_BOT_TOKEN>
TELEGRAM_CHAT_ID=<YOUR_CHAT_ID>
STUDIO_URL=http://localhost:3333
```

4. **Initialize the example**

Run this if you haven't initialized blueprints:

```bash
npx sanity blueprints init
```

You'll be prompted to select your organization and Sanity studio.

Then run:

```bash
npx sanity blueprints add function --example telegram-notify
```

5. **Add configuration to your blueprint**

```ts
// sanity.blueprint.ts
import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'
import process from 'node:process'

const {TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID} = process.env
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set')
}

export default defineBlueprint({
  // ...all other settings
  resources: [
    //...all other functions
    defineDocumentFunction({
      name: 'comment-telegram',
      event: {
        on: ['create'],
        filter: '_type == "comment" && defined(comment)',
        projection: '{_id, comment}',
      },
      env: {TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID},
    }),
  ],
})
```

6. **Install dependencies**

```bash
npm install
```

## Testing the function locally

You can test the telegram-notify function locally using the Sanity CLI before deploying:

### 1. Basic Function Test

Test with the included sample document:

```bash
npx sanity functions test telegram-notify --file document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test telegram-notify --data '{
  "_type": "comment",
  "_id": "test-comment-123",
  "comment": "Loved this article, great read!"
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset:

```bash
# Export a real document for testing
npx sanity documents get "your-comment-id" > document.json

# Test with the real document
npx sanity functions test telegram-notify --file document.json
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test with real Telegram tokens** - The function requires valid credentials to work
- **Check function logs** in CLI output for debugging

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)
- Valid Telegram bot token and chat ID

### Deploy to production

1. **Deploy your blueprint**

From your project root, run:

```bash
npx sanity blueprints deploy
```

This command will:

- Package your function code
- Upload it to Sanity's infrastructure
- Configure the event triggers for new comment creation
- Make your telegram-notify function live in production
- Deploy .env file in the root directory if it exists

2. **If not using an .env file, add environment variables manually**

After deployment, if you're not using a .env file in your projects root, you need to add your Telegram credentials as environment variables:

```bash
npx sanity functions env add comment-telegram TELEGRAM_BOT_TOKEN "your-telegram-bot-token-here"
npx sanity functions env add comment-telegram TELEGRAM_CHAT_ID "your-chat-id-here"
npx sanity functions env add comment-telegram STUDIO_URL "https://your-studio.sanity.studio"
```

You can verify the environment variables were added successfully:

```bash
npx sanity functions env list comment-telegram
```

4. **Verify deployment**

After deployment, you can verify your function is active by:

- Creating a new comment and confirming Telegram notifications are sent
- Monitoring function logs in the CLI

```bash
npx sanity functions logs comment-telegram
```

## Related Examples

- [Slack Notify](../slack-notify/README.md) - Send a Slack notification when a document is published
