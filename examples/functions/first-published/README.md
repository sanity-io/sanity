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

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)

### Deploy to production

1. **Verify your blueprint configuration**

   Make sure your `sanity.blueprint.ts` file is properly configured with the first-published function:

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'first-published',
         src: './functions/first-published',
         memory: 1,
         timeout: 10,
         event: {
           on: ['create'],
           filter: "_type == 'post' && !defined(firstPublished)",
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
   - Make your first-published function live in production

3. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Checking the Sanity Manage console under "API > Functions"
   - Publishing a new post and confirming the `firstPublished` field is set
   - Monitoring function logs in the CLI

### Deployment best practices

- **Test thoroughly first** - Always test your function locally before deploying
- **Use specific filters** - The current filter only targets posts without `firstPublished` to avoid unnecessary executions
- **Verify setIfMissing behavior** - Ensure the function won't overwrite existing timestamps
- **Check schema compatibility** - Make sure your `firstPublished` field exists in your schema
- **Monitor performance** - This is a lightweight function with minimal resource requirements

### Troubleshooting deployment

**Error: "Deploy Studio permission required"**

- Cause: Your account doesn't have deployment permissions for this project
- Solution: Ask a project admin to grant you Deploy Studio permissions

**Error: "Blueprint validation failed"**

- Cause: Issues with your `sanity.blueprint.ts` configuration
- Solution: Check the configuration matches the expected schema

**Function not setting firstPublished after deployment**

- Cause: Posts may already have the field set, or the schema field may not exist
- Solution: Test with new posts that don't have `firstPublished` set and verify the field exists in your schema

For more details, see the [official function deployment documentation](https://www.sanity.io/docs/compute-and-ai/function-quickstart).

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
