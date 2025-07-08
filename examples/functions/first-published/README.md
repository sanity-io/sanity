# First Published Function

**📖 [← Back to Functions Overview](../README.md)**

## Overview

**Problem:** Content teams need to track when articles were first published for analytics and editorial workflows, but manually setting timestamps is error-prone and often forgotten during publishing.

**Solution:** This Sanity Function automatically sets a `firstPublished` timestamp when a post is published for the first time, using `setIfMissing` to ensure the value is only set once and never overwritten.

**Benefits:**

- **Eliminates manual timestamp tracking** by automating first-publish detection
- **Ensures data accuracy** with automatic timestamp creation
- **Preserves historical data** by never overwriting existing timestamps
- **Supports analytics workflows** with reliable publication timing data
- **Reduces editorial overhead** for content teams

## Schema Requirements

Add a `firstPublished` field to your post schema:

```typescript
// In your post schema (e.g., studio/src/schemaTypes/documents/post.ts)
defineField({
  name: 'firstPublished',
  title: 'First Published',
  type: 'datetime',
  readOnly: () => true, // Optional: makes field read-only
  description: 'Timestamp will be automatically set when the post is first published',
}),
```

Deploy your schema: `npx sanity schema deploy` (from studio/ folder)

## Implementation

### Step 1: Choose Your Installation Method

For a **new project**:

```bash
npx sanity blueprints init --example first-published
```

For an **existing project**:

```bash
npx sanity blueprints add function --example first-published
```

### Step 2: Install Dependencies

Install dependencies in the project root:

```bash
npm install @sanity/functions
npm install
```

Install function-specific dependencies:

```bash
cd functions/first-published
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
      name: 'first-published',
      src: './functions/first-published',
      memory: 1,
      timeout: 10,
      event: {
        on: ['publish'],
        filter: "_type == 'post' && !defined(firstPublished)",
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

When a content editor publishes a new blog post for the first time, the function automatically:

1. **Triggers** on the publish event for post documents without a firstPublished field
2. **Checks** if the firstPublished field is already set (using filter)
3. **Sets** the current timestamp using `setIfMissing` to prevent overwriting
4. **Preserves** the original timestamp on subsequent publishes

**Result:** Content teams get automatic first-publish tracking without manual effort, enabling accurate analytics and editorial workflows.

## Customization Options

### Target Different Document Types

```typescript
// In blueprint configuration
filter: "_type == 'article' && !defined(firstPublished)"
```

### Change Field Name

```typescript
// In function code
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

## Testing & Deployment

For complete testing and deployment instructions, see the [Functions Overview](../README.md):

- **[Testing Guide](../README.md#testing-functions-locally)** - Local testing with sample or real data
- **[Deployment Guide](../README.md#deployment-guide)** - Deploy to production
- **[Troubleshooting](../README.md#troubleshooting)** - Common issues and solutions

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
