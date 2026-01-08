# Auto-Summary Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams often need concise summaries of long-form content (like blog posts or articles) for previews, SEO, or editorial workflows. Manually writing these summaries is time-consuming and inconsistent, especially as content volume grows.

## Solution

This example demonstrates how to use a Sanity Function to automatically generate a summary for a document's content field using Sanity's Agent Actions. When a post's content is changed the function generates a summary (up to 250 words) and writes it to the `autoSummary` field.

## Benefits

- **Saves 2-3 minutes per post** by eliminating manual summary writing
- **Saves editorial time** by automating summary creation for every post
- **Improves consistency** in summary style and length across all content
- **Scales easily** as content volume increases, with no extra manual effort
- **Reduces editorial overhead** for content teams

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the autoSummary field to your schema

If you're using the [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean), you'll need to add a `tags` field to your post schema:

1. Open `studio/src/schemaTypes/documents/post.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'autoSummary',
  title: 'Auto Summary',
  type: 'text',
  description: 'Summary will be automatically generated when you publish a post',
}),
```

3. Deploy your updated schema:

```bash
# /studio
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
   npx sanity blueprints add function --example auto-summary
   ```

2. **Add configuration to your blueprint**

   Add the following resource to your `sanity.blueprint.ts`:

   ```ts
   defineDocumentFunction({
     type: 'sanity.function.document',
     src: './functions/auto-summary',
     memory: 2,
     timeout: 30,
     name: 'auto-summary',
     event: {
       on: ['create', 'update'],
       filter: "_type == 'post' && delta::changedAny(content)",
       projection: '{_id}',
     },
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

You can test the auto-summary function locally using the Sanity CLI before deploying it to production.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test auto-summary --document-id <insert-document-id> --dataset production --with-user-token
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
- **Test edge cases** like posts without content or with existing summaries
- **Check function logs** in CLI output for debugging
- **Test without AI calls** first by setting `noWrite: true` in the function
- **Create test content** - If you don't have posts without summaries, create some test documents first

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (for content analysis)
  - A `autoSummary` field (string or text) (for storing generated summary)
- Access to Sanity's AI capabilities
- Node.js v22.x for local testing

## Usage Example

When a content editor creates a blog post or modifies the 'content' field, the function automatically:

2. **Analyzes** the post's content field using AI
3. **Generates** a summary (max 250 words) based on the content field
4. **Applies** the summary directly to the document

**Result:** Content creators get consistent, relevant summaries without manual effort.

## Customization

- Change the `instruction` string in `index.ts` to adjust the summary style, length, or language.
- Modify the `filter` in the blueprint resource to target different document types or conditions.
- Set `noWrite: false` in the function to automatically write the summary to the document in production.

## Troubleshooting

**Error: "Error occurred during summary generation"**

- Cause: The AI action may fail if the document is missing a `content` field or if there are API issues.
- Solution: Ensure the document has a valid `content` field and check your Sanity project configuration.

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) – Automatically generate tags for documents using AI
- [Other AI-powered examples](https://github.com/sanity-io/sanity/tree/main/examples)

---
