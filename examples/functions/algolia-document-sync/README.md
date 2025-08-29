# Algolia Document Sync Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to keep their search functionality up-to-date with their latest content, but manually syncing content to search indexes is time-consuming and error-prone. This creates a gap between published content and searchable content.

## Solution

This Sanity Function automatically syncs documents to Algolia's search index, ensuring your search functionality always reflects your latest content. When a post is published, the function sends the document data to Algolia, either creating a new search record or updating an existing one. We also track when documents are updated and deleted, using the delta operation our function can remove an item from Algolia under the delete operation. We could selectively update for create vs update but for now we pass the same addOrUpdate to Algolia.

## Benefits

- **Real-time search updates** by automatically syncing content on publish
- **Reduces manual work** by eliminating the need for manual search index updates
- **Ensures search accuracy** by keeping search results in sync with published content
- **Simplifies search implementation** with automatic document synchronization
- **Supports scalable content** by handling updates automatically as content grows

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

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
   npx sanity blueprints add function --example algolia-document-sync
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import 'dotenv/config'
   import process from 'node:process'

   const {ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY} = process.env
   if (typeof ALGOLIA_APP_ID !== 'string' || typeof ALGOLIA_WRITE_KEY !== 'string') {
     throw new Error('ALGOLIA_APP_ID and ALGOLIA_WRITE_KEY must be set')
   }

   defineDocumentFunction({
     type: 'sanity.function.document',
     name: 'algolia-document-sync',
     memory: 1,
     timeout: 10,
     src: './functions/algolia-document-sync',
     event: {
       on: ['create', 'update', 'delete'],
       filter: "_type == 'post'",
       projection: '{_id, title, hideFromSearch, "operation": delta::operation()}',
     },
     env: {
       ALGOLIA_APP_ID: ALGOLIA_APP_ID,
       ALGOLIA_WRITE_KEY: ALGOLIA_WRITE_KEY,
     },
   })
   ```

3. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install dotenv
   ```

4. **Set up environment variables**

   Add your Algolia credentials to your root .env file:
   - `ALGOLIA_APP_ID`: Your Algolia application ID
   - `ALGOLIA_WRITE_KEY`: Your Algolia write API key

## Testing the function locally

You can test the algolia-document-sync function locally using the Sanity CLI before deploying:

### 1. Basic Function Test

This function writes directly to Algolia, so we can test locally with our document.json without relying on any Sanity schema.

Test with the included sample document:

```bash
npx sanity functions test algolia-document-sync --file functions/algolia-document-sync/document.json --dataset production --with-user-token
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test algolia-document-sync --data '{
  "_type": "post",
  "_id": "test-post",
  "title": "Test Article"
}' --dataset production --with-user-token
```

### 4. Test with Real Document Data

Capture a real document from your dataset:

```bash
# From the studio/ folder export a real document for testing
cd studio
npx sanity documents get "your-post-id" > ../test-document.json

# Back to project root for function testing
cd ..
npx sanity functions test algolia-document-sync --file test-document.json --dataset production --with-user-token
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Syncing to Algolia:', data._id)
```

### Testing Tips

- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test with valid Algolia credentials** to ensure proper syncing
- **Check function logs** in CLI output for debugging
- **Verify Algolia index updates** after function execution

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `title` field to sync to Algolia
- An Algolia account with:
  - Application ID
  - Write API key
  - An index named 'posts' (or modify the code to use your index name)
- Node.js v22.x for local development

## Usage Example

When a content editor publishes a blog post, the function automatically:

1. **Triggers** on the publish event for post documents
2. **Extracts** the document data (currently title and ID)
3. **Sends** the data to Algolia using the Algolia client
4. **Updates** the search index with the latest content

**Sample input document:**

```json
{
  "_type": "post",
  "_id": "test-post-123",
  "title": "My First Blog Post",
  "slug": {
    "current": "my-first-blog-post"
  },
  "body": "This is the content of my first blog post.",
  "author": {
    "_type": "reference",
    "_ref": "author-123"
  },
  "publishedAt": "2024-01-15T10:00:00.000Z",
  "hideFromSearch": false
}
```

**Result:** The document is synced to Algolia's search index, making it immediately searchable.

## Customization

### Modify Indexed Fields

Update the fields sent to Algolia by modifying the object in `addOrUpdateObject`:

```typescript
await algolia.addOrUpdateObject({
  indexName: 'posts',
  objectID: _id,
  body: {
    title,
    slug: data.slug?.current,
    publishedAt: data.publishedAt,
    // Add more fields as needed
  },
})
```

### Change Target Index

Modify the index name to sync to a different Algolia index, alternatively pass \_type into the projection so you can sync to indexes based on the post type, allowing one function to update many indexes:

```typescript
await algolia.addOrUpdateObject({
  indexName: 'your-custom-index', // Different index name
  objectID: _id,
  body: {
    title,
  },
})
```

### Add Document Filtering

Update the filter to sync specific document types or conditions:

```typescript
filter: "_type == 'post' && defined(publishedAt)"
```

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
- [First Published Function](../first-published/README.md) - Track when content was first published
