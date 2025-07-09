# Auto-Summary Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams often need concise summaries of long-form content (like blog posts or articles) for previews, SEO, or editorial workflows. Manually writing these summaries is time-consuming and inconsistent, especially as content volume grows.

## Solution

This example demonstrates how to use a Sanity Function to automatically generate a summary for a document's body field using Sanity's AI capabilities. When a new post is published and does not already have an `autoSummary`, the function generates a summary (up to 250 words) and writes it to the `autoSummary` field.

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

   Run this if you haven't initlized blueprints:

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
       on: ['publish'],
       filter: "_type == 'post' && !defined(autoSummary)",
       projection: '_id',
     },
   })
   ```

3. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install
   ```

   And install function dependencies:

   ```bash
   npm install @sanity/functions
   cd functions/auto-summary
   npm install
   cd ../..
   ```

4. **Make sure you have a schema deployed**

From the studio folder, run:

```bash
# In the studio/ folder
npx sanity schema deploy
```

## Testing the function locally

You can test the auto-summary function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/auto-summary/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test auto-summary --file functions/auto-summary/document.json
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing post document
cd studio
npx sanity documents query "*[_type == 'post' && !defined(autoSummary)][0]" > ../real-post.json

# Back to project root for function testing
cd ..
npx sanity functions test auto-summary --file real-post.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

For custom data testing, you still need to use a real document ID that exists in your dataset:

```bash
# From the studio/ folder, create or find a real document ID
cd studio
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'post'][0]._id")

# Create a temporary JSON file with custom data in project root
cd ..
cat > test-custom-data.json << EOF
{
  "_type": "post",
  "_id": $REAL_DOC_ID,
  "content": [
    {
      "_type": "block",
      "_key": "test-block",
      "children": [
        {
          "_type": "span",
          "_key": "test-span",
          "text": "Your custom blog post content here..."
        }
      ]
    }
  ]
}
EOF

# Test with the custom data file
npx sanity functions test auto-summary --file test-custom-data.json
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'post' && !defined(autoSummary)][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test auto-summary --file test-real-document.json
```

### 5. Enable Debugging

Add temporary logging to your function:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Result:', result)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like posts without content or with existing tags
- **Check function logs** in CLI output for debugging
- **Test without AI calls** first by setting `noWrite: true` in the function
- **Create test content** - If you don't have posts without tags, create some test documents first

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `body` field (for content analysis)
  - A `autoSummary` field (strig or text) (for storing generated summary)
- Access to Sanity's AI capabilities
- Node.js v22.x for local testing

## Usage Example

When a content editor publishes a new blog post without a sumamry, the function automatically:

1. **Triggers** on the publish event for post documents without existing summary
2. **Analyzes** the post's content field using AI
3. **Generates** a summary (max 250 words) based on the content field
4. **Applies** the summary directly to the published document

**Result:** Content creators get consistent, relevant summaries without manual effort.

## Customization

- Change the `instruction` string in `index.ts` to adjust the summary style, length, or language.
- Modify the `filter` in the blueprint resource to target different document types or conditions.
- Set `noWrite: false` in the function to automatically write the summary to the document in production.

## Troubleshooting

**Error: "Error occurred during summary generation"**

- Cause: The AI action may fail if the document is missing a `body` field or if there are API issues.
- Solution: Ensure the document has a valid `body` field and check your Sanity project configuration.

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) – Automatically generate tags for documents using AI
- [Other AI-powered examples](https://github.com/sanity-io/sanity/tree/main/examples)

---
