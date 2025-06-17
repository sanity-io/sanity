# Auto-Summary Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams often need concise summaries of long-form content (like blog posts or articles) for previews, SEO, or editorial workflows. Manually writing these summaries is time-consuming and inconsistent, especially as content volume grows.

## Solution

This example demonstrates how to use a Sanity Function to automatically generate a summary for a document's body field using Sanity's AI capabilities. When a new post is published and does not already have an `autoSummary`, the function generates a summary (up to 250 words) and writes it to the `autoSummary` field.

## Benefits

- **Saves editorial time** by automating summary creation for every post
- **Improves consistency** in summary style and length across all content
- **Scales easily** as content volume increases, with no extra manual effort
- **Enables new workflows** (e.g., automated previews, SEO descriptions) with minimal setup

## Implementation

1. **Initialize the example**

   For a new project:

   ```bash
   npx sanity blueprints init --example auto-summary
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example auto-summary
   ```

2. **Add configuration to your blueprint**

   Add the following resource to your `sanity.blueprint.ts`:

   ```ts
   defineDocumentFunction({
     name: 'auto-summary',
     on: ['publish'],
     filter: "_type == 'post' && !defined(autoSummary)",
     projection: '_id',
     // ...other options as needed
   })
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Adjust schema**

   Ensure your `post` schema includes a `body` field (Portable Text or string) and an `autoSummary` field (string or text).

## Testing the function locally

You can test the auto-summary function locally using the Sanity CLI before deploying:

### 1. Basic Function Test

Test with the included sample document:

```bash
npx sanity functions test auto-summary --file document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test auto-summary --data '{
  "_type": "post",
  "_id": "your-post-id",
  "body": [{"_type": "block", "children": [{"_type": "span", "text": "Your content here."}]}]
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset:

```bash
# Export a real document for testing
npx sanity documents get "document-id" > test-document.json

# Test with the real document
npx sanity functions test auto-summary --file test-document.json
```

### 5. Enable Debugging

Add temporary logging to your function:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Result:', result)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Test without external API calls** first when applicable

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `body` field (for content analysis)
  - A `autoSummary` field (strig or text) (for storing generated summary)
- Access to Sanity's AI capabilities
- Node.js v22.x for local testing

## Usage Example

When a `post` document is published and does not have an `autoSummary`, the function automatically:

1. Detects the publish event for a `post` without an `autoSummary`
2. Reads the `body` field from the document
3. Uses Sanity's AI action to generate a summary (max 250 words)
4. Writes the summary to the `autoSummary` field (if `noWrite` is set to `false`)

**Sample input document:**

```json
{
  "_type": "post",
  "_id": "1bcef8ce-b129-4f95-a30c-b958b65ead10",
  "title": "My first post",
  "body": [
    {
      "_type": "block",
      "children": [
        {
          "_type": "span",
          "text": "The latest advancements in artificial intelligence and machine learning are revolutionizing how businesses operate. Deep learning models can now process natural language with remarkable accuracy, enabling more sophisticated chatbots and virtual assistants. These AI systems are particularly effective at automating customer service tasks and analyzing large datasets to identify patterns and insights."
        }
      ]
    }
  ]
}
```

**Result:**

A summary is generated and written to the `autoSummary` field of the document.

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