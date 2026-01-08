# Tone of Voice Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content creators often need to understand the tone of voice in their content to ensure consistency and alignment with brand guidelines. Manually analyzing tone can be time-consuming and subjective, especially for longer pieces of content.

## Solution

This function automatically analyzes the tone of voice of your content using Sanity's Agent Actions (AI) capabilities. When triggered, it examines the content and saves an analysis of the tone to a field in your schema, making it easy for content creators to understand and maintain consistent voice across their content.

## Benefits

- Saves time by automatically analyzing content tone
- Provides objective feedback on writing style
- Helps maintain consistent brand voice across content
- Stores tone analysis directly in the document for easy reference
- Enables quick review of content tone during editing

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the toneOfVoice field to your schema

If you're using the [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean), you'll need to add a `toneOfVoice` field to your post schema:

1. Open `studio/src/schemaTypes/documents/post.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'toneOfVoice',
  title: 'Tone of Voice',
  type: 'text',
  readOnly: () => true, // This is optional
  description: 'Tone of voice analysis will be automatically generated when you publish a post',
}),
```

3. Deploy your updated schema:

```bash
# From the studio/ folder
npx sanity schema deploy
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example capture-tone-of-voice
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'capture-tone-of-voice',
         src: './functions/capture-tone-of-voice',
         memory: 2,
         timeout: 60,
         event: {
           on: ['create', 'update'],
           filter: "_type == 'post' && delta::changedAny(content)",
           projection: '{_id}',
         },
       }),
     ],
   })
   ```

3. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install
   ```

4. **Make sure you have a schema deployed**

   From the studio folder, run:

   ```bash
   # In the studio/ folder
   npx sanity schema deploy
   ```

## Testing the function locally

You can test the capture-tone-of-voice function locally using the Sanity CLI before deploying it to production.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test capture-tone-of-voice --document-id <insert-document-id> --dataset production --with-user-token
```

Replace `<insert-document-id>` with an actual document ID from your dataset and `production` with your dataset name.

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Test without external API calls** first when applicable
- **Create test content** - If you don't have suitable documents, create some test documents first

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Be sure to set `noWrite: false` in your Agent Action Function.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)

### Deploy to production

1. **Verify your blueprint configuration**

Make sure your `sanity.blueprint.ts` file is properly configured with your function:

```ts
// sanity.blueprint.ts
import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      type: 'sanity.function.document',
      name: 'capture-tone-of-voice',
      src: './functions/capture-tone-of-voice',
      memory: 2,
      timeout: 60,
      event: {
        on: ['create', 'update'],
        filter: "_type == 'post' && delta::changedAny(content)",
        projection: '{_id}',
      },
    }),
  ],
})
```

2. **Deploy your blueprint**

From your project root, run:

```bash
npx sanity blueprints deploy
```

This command will:

- Package your function code
- Upload it to Sanity's infrastructure
- Configure the event triggers for post publications
- Make your capture-tone-of-voice function live in production

3. **Verify deployment**

After deployment, you can verify your function is active by:

- Publishing a new post and confirming the `toneOfVoice` field is populated
- Monitoring function logs in the CLI by running `npx sanity functions logs log-event`

### Deployment best practices

- **Test thoroughly first** - Always test your function locally before deploying
- **Avoid recursion** - When the `toneOfVoice` function runs, it writes changes to the same document's `toneOfVoice` field but **does not** publish the document. Be sure not to add `skipforcePublishedWrite: true,` to your index.ts's agent.action.generate function, as this will create an infinite loop
- **Monitor AI usage** - Agent Actions have usage limits and costs. Visit Settings in your Manage console to learn more
- **Use specific filters** - The current filter targets all posts. To avoid unnecessary executions, setup additional logic to trigger this function only when certain criteria is met
- **Monitor performance** - This function uses AI processing and may have longer execution times

### Troubleshooting deployment

**Error: "Deploy Studio permission required"**

- Cause: Your account doesn't have deployment permissions for this project
- Solution: Ask a project admin to grant you Deploy Studio permissions

**Error: "Blueprint validation failed"**

- Cause: Issues with your `sanity.blueprint.ts` configuration
- Solution: Check the configuration matches the expected schema

**Function not analyzing tone after deployment**

- Cause: Posts may not trigger the function, or AI features may not be enabled
- Solution: Test with new posts and verify AI features are enabled in your project settings

For more details, see the [official function deployment documentation](https://www.sanity.io/docs/compute-and-ai/function-quickstart).

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (for content analysis)
  - A `toneOfVoice` field in your schema (type: text, optionally hidden or readonly)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a document is created or updated, the function automatically:

1. **Triggers** on the publish event for post documents when the content field changes
2. **Analyzes** the content in the `content` field using Sanity's AI
3. **Generates** a tone of voice analysis
4. **Writes** the tone analysis to the `toneOfVoice` field

**Result:** Content creators get automatic tone analysis that helps maintain consistent voice across their content.

## Customization

### Find the tone of voice on a different field

```typescript
instructionParams: {
  content: {
    type: "field",
    path: "DESIRED_FIELD",
  },
},
```

## Troubleshooting

### Common Issues

**Error: "Cannot find module '@sanity/client'"**

- Cause: Dependencies not installed
- Solution: Run `npm install` in the function directory

**Error: "Field 'toneOfVoice' not found in schema"**

- Cause: Missing schema field
- Solution: Add the `toneOfVoice` field to your schema as described in the Implementation section

**Error: "Agent Action can't access 'toneOfVoice' field"**

- Cause: Agent Action needs permission to access hidden & readonly fields.
- Solution: Configure the Agent Action to be able to access hidden & readonly fields, view [https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7](https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7)
