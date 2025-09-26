# First Published Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to track when articles were first published for analytics and editorial workflows, but manually setting timestamps is error-prone and often forgotten during publishing.

## Solution

This Sanity Function automatically sets a `firstPublished` timestamp when a post is published for the first time, using `setIfMissing` to ensure the value is only set once and never overwritten.

## Benefits

- **Eliminates manual timestamp tracking** by automating first-publish detection
- **Ensures data accuracy** with automatic timestamp creation
- **Preserves historical data** by never overwriting existing timestamps
- **Supports analytics workflows** with reliable publication timing data
- **Reduces editorial overhead** for content teams

## Implementation

1. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example first-published
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   defineDocumentFunction({
     name: 'first-published',
     memory: 1,
     timeout: 10,
     event: {
       on: ['create'],
       filter: "_type == 'post' && !defined(firstPublished)",
       projection: '{_id}',
     },
   })
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

## Testing the function locally

You can test the first-published function locally using the Sanity CLI before deploying.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test first-published --document-id <insert-document-id> --dataset production --with-user-token
```

Replace `<insert-document-id>` with an actual document ID from your dataset and `production` with your dataset name.

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

#### Enable Debugging

Add temporary logging to your function:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Setting firstPublished for:', data._id)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like documents that already have firstPublished set
- **Check function logs** in CLI output for debugging
- **Verify the setIfMissing behavior** by running the function multiple times

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `firstPublished` field (datetime) for storing the timestamp
- Node.js v22.x for local development

## Usage Example

When a content editor publishes a new blog post for the first time, the function automatically:

1. **Triggers** on the publish event for post documents without a firstPublished field
2. **Checks** if the firstPublished field is already set (using filter)
3. **Sets** the current timestamp using `setIfMissing` to prevent overwriting
4. **Preserves** the original timestamp on subsequent publishes

**Result:** Content teams get automatic first-publish tracking without manual effort, enabling accurate analytics and editorial workflows.

## Customization

### Adjust Document Types

Modify the blueprint filter to target different content types:

```typescript
filter: "_type == 'article' && !defined(firstPublished)"
```

### Change Field Name

Update the field name being set:

```typescript
await client.patch(data._id, {
  setIfMissing: {
    initialPublishDate: new Date().toISOString(), // Different field name
  },
})
```

### Add Additional Metadata

Set multiple fields when first publishing:

```typescript
await client.patch(data._id, {
  setIfMissing: {
    firstPublished: new Date().toISOString(),
    publishedYear: new Date().getFullYear(),
    publishedMonth: new Date().getMonth() + 1,
  },
})
```

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
