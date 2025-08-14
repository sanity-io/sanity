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

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

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

You can test the auto-tag function locally using the Sanity CLI before deploying it to production.

### Simple Testing Command

Test the function with an existing document ID from your dataset:

```bash
npx sanity functions test auto-tag --document-id <insert-document-id> --dataset production --with-user-token
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
