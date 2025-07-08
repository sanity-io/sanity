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

## Function Configuration

```ts
// sanity.blueprint.ts
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
})
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

## Implementation & Testing

For complete implementation, testing, and deployment instructions, see the [Functions Overview](../README.md).

**Quick Start:**

1. Install: `npx sanity blueprints add function --example auto-tag`
2. Follow the [Implementation Guide](../README.md#implementation-guide)
3. Test locally using the [Testing Guide](../README.md#testing-functions-locally)
4. Deploy using the [Deployment Guide](../README.md#deployment-guide)
