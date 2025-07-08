# Auto-Tag Function

**📖 [← Back to Functions Overview](../README.md)**

## Overview

**Problem:** Content creators spend significant time manually tagging blog posts, leading to inconsistent tagging across content libraries and reduced productivity in editorial workflows.

**Solution:** This Sanity Function automatically generates 3 relevant tags for blog posts by analyzing content using AI, intelligently reusing existing tags from other posts to maintain vocabulary consistency.

**Benefits:**

- **Saves 2-3 minutes per post** by eliminating manual tagging
- **Improves content discoverability** through consistent tag application
- **Maintains tag vocabulary** by prioritizing reuse of existing tags
- **Scales automatically** as your content library grows
- **Reduces editorial overhead** for content teams

## Schema Requirements

Add a `tags` field to your post schema:

```typescript
// In your post schema (e.g., studio/src/schemaTypes/documents/post.ts)
defineField({
  name: 'tags',
  title: 'Tags',
  type: 'array',
  of: [{ type: 'string' }],
  description: 'Tags will be automatically generated when you publish a post',
}),
```

Deploy your schema: `npx sanity schema deploy` (from studio/ folder)

## Implementation

### Step 1: Choose Your Installation Method

For a **new project**:

```bash
npx sanity blueprints init --example auto-tag
```

For an **existing project**:

```bash
npx sanity blueprints add function --example auto-tag
```

### Step 2: Install Dependencies

Install dependencies in the project root:

```bash
npm install @sanity/functions
npm install
```

Install function-specific dependencies:

```bash
cd functions/auto-tag
npm install
cd ../..
```

### Step 3: Configure Your Blueprint

Add the function configuration to your `sanity.blueprint.ts` file:

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

### Step 4: Deploy Your Schema

Make sure your schema is deployed before testing:

```bash
# From the studio/ folder
cd studio
npx sanity schema deploy
cd ..
```

## How It Works

When a content editor publishes a new blog post without tags, the function automatically:

1. **Triggers** on the publish event for post documents without existing tags
2. **Analyzes** the post's content field using AI
3. **Retrieves** existing tags from other published posts for vocabulary consistency
4. **Generates** 3 relevant tags, prioritizing reuse of existing tags when appropriate
5. **Applies** the tags directly to the published document

**Result:** Content creators get consistent, relevant tags without manual effort, improving content organization and discoverability.

## Customization Options

### Change Number of Tags

```typescript
instruction: `Based on the $content, create 5 relevant tags instead of 3.`
```

### Modify Tag Format

```typescript
instruction: `Focus on technical topics and use camelCase format for tags.`
```

### Target Different Field

```typescript
target: {
  path: 'categories', // Instead of 'tags'
}
```

### Filter Different Document Types

```typescript
// In blueprint configuration
filter: "_type == 'article' && !defined(keywords)"
```

## Testing & Deployment

For complete testing and deployment instructions, see the [Functions Overview](../README.md):

- **[Testing Guide](../README.md#testing-functions-locally)** - Local testing with sample or real data
- **[Deployment Guide](../README.md#deployment-guide)** - Deploy to production
- **[Troubleshooting](../README.md#troubleshooting)** - Common issues and solutions
