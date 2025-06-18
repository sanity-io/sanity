# Auto-Tag Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content creators spend significant time manually tagging blog posts, leading to inconsistent tagging across content libraries and reduced productivity in editorial workflows.

## Solution

This Sanity Function automatically generates 3 relevant tags for blog posts by analyzing content using AI, intelligently reusing existing tags from other posts to maintain vocabulary consistency.

## Benefits

- **Saves 2-3 minutes per post** by eliminating manual tagging
- **Improves content discoverability** through consistent tag application
- **Maintains tag vocabulary** by prioritizing reuse of existing tags
- **Scales automatically** as your content library grows
- **Reduces editorial overhead** for content teams

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the tags field to your schema

If you're using the [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean), you'll need to add a `tags` field to your post schema:

1. Open `studio/src/schemaTypes/documents/post.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'tags',
  title: 'Tags',
  type: 'array',
  of: [{ type: 'string' }],
  description: 'Tags will be automatically generated when you publish a post',
}),
```

3. Deploy your updated schema:

```bash
npx sanity schema deploy
```

## Implementation

1. **Initialize the example**

   For a new project:

   ```bash
   npx sanity blueprints init --example auto-tag
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example auto-tag
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   defineDocumentFunction({
     name: 'auto-tag',
     memory: 2,
     timeout: 30,
     on: ['publish'],
     filter: "_type == 'post' && !defined(tags)",
     projection: '_id',
   })
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Make sure you have a schema deployed**

From a Studio project, run:

```bash
npx sanity schema deploy
```

## Testing the function locally

You can test the auto-tag function locally using the Sanity CLI before deploying it to production.

### 1. Basic Function Test

Upload the test document to your dataset ([requires your CLI to be configured](https://www.sanity.io/docs/apis-and-sdks/cli#k4baf8325e0e3)):

```bash
npx sanity documents create functions/auto-tag/document.json
```

Test the function with the included sample document:

```bash
npx sanity functions test auto-tag --file functions/auto-tag/document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test auto-tag --data '{
  "_type": "post",
  "_id": "your-post-id",
  "content": "Your blog post content here..."
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset for testing:

```bash
# Export a real document for testing
npx sanity documents get "your-post-id" > test-document.json

# Test with the real document
npx sanity functions test auto-tag --file test-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Generated tags:', result.tags)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like posts without content or with existing tags
- **Check function logs** in CLI output for debugging
- **Test without AI calls** first by setting `noWrite: true` in the function

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (for content analysis)
  - A `tags` array field (for storing generated tags)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a content editor publishes a new blog post without tags, the function automatically:

1. **Triggers** on the publish event for post documents without existing tags
2. **Analyzes** the post's content content using AI
3. **Retrieves** existing tags from other published posts for vocabulary consistency
4. **Generates** 3 relevant tags, prioritizing reuse of existing tags when appropriate
5. **Applies** the tags directly to the published document

**Result:** Content creators get consistent, relevant tags without manual effort, improving content organization and discoverability.

## Customization

### Adjust Tag Generation

Modify the AI instruction to change tagging behavior:

```typescript
instruction: `Based on the $content, create 5 relevant tags instead of 3. Focus on technical topics and use camelCase format.`
```

### Change Target Field

Update the target path to save tags to a different field:

```typescript
target: {
  path: 'categories', // Instead of 'tags'
}
```

### Filter Different Document Types

Modify the blueprint filter to target different content types:

```typescript
filter: "_type == 'article' && !defined(keywords)"
```
