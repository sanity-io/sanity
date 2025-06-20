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
# /studio
npx sanity schema deploy
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

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
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'auto-tag',
         src: './functions/auto-tag',
         memory: 2,
         timeout: 30,
         event: {
           on: ['publish'],
           filter: "_type == 'post' && !defined(tags)",
           projection: '_id',
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

   And install function dependencies:

   ```bash
   npm install @sanity/functions
   cd functions/auto-tag
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

You can test the auto-tag function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/auto-tag/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test auto-tag --file functions/auto-tag/document.json
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing post document
cd studio
npx sanity documents query "*[_type == 'post' && !defined(tags)][0]" > ../real-post.json

# Back to project root for function testing
cd ..
npx sanity functions test auto-tag --file real-post.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data

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
npx sanity functions test auto-tag --file test-custom-data.json
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'post' && !defined(tags)][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test auto-tag --file test-real-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Generated tags:', result.tags)
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
  - A `content` field with portable text (for content analysis)
  - A `tags` array field (for storing generated tags)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a content editor publishes a new blog post without tags, the function automatically:

1. **Triggers** on the publish event for post documents without existing tags
2. **Analyzes** the post's content field using AI
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
