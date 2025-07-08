# Capture Tone of Voice Function

**📖 [← Back to Functions Overview](../README.md)**

## Overview

**Problem:** Content creators often need to understand the tone of voice in their content to ensure consistency and alignment with brand guidelines. Manually analyzing tone can be time-consuming and subjective, especially for longer pieces of content.

**Solution:** This function automatically analyzes the tone of voice of your content using Sanity's Agent Actions (AI) capabilities. When triggered, it examines the content and saves an analysis of the tone to a field in your schema, making it easy for content creators to understand and maintain consistent voice across their content.

**Benefits:**

- **Saves time** by automatically analyzing content tone
- **Provides objective feedback** on writing style
- **Helps maintain consistent brand voice** across content
- **Stores tone analysis directly in the document** for easy reference
- **Enables quick review** of content tone during editing

## Schema Requirements

Add a `toneOfVoice` field to your post schema:

```typescript
// In your post schema (e.g., studio/src/schemaTypes/documents/post.ts)
defineField({
  name: 'toneOfVoice',
  title: 'Tone of Voice',
  type: 'text',
  readOnly: () => true, // Optional: makes field read-only
  description: 'Tone of voice analysis will be automatically generated when you publish a post',
}),
```

Deploy your schema: `npx sanity schema deploy` (from studio/ folder)

## Function Configuration

```ts
// sanity.blueprint.ts
defineDocumentFunction({
  type: 'sanity.function.document',
  name: 'capture-tone-of-voice',
  src: './functions/capture-tone-of-voice',
  memory: 2,
  timeout: 60,
  event: {
    on: ['publish'],
    filter: "_type == 'post'",
    projection: '_id',
  },
})
```

## How It Works

When a document is published, the function automatically:

1. **Triggers** on the publish event for post documents
2. **Analyzes** the content in the `content` field using Sanity's AI
3. **Generates** a tone of voice analysis
4. **Writes** the tone analysis to the `toneOfVoice` field

**Result:** Content creators get automatic tone analysis that helps maintain consistent voice across their content.

## Customization Options

### Analyze Different Field

```typescript
instructionParams: {
  content: {
    type: "field",
    path: "description", // Instead of 'content'
  },
},
```

### Custom Analysis Instructions

Modify the AI instruction to focus on specific aspects:

```typescript
instruction: `Analyze the tone of voice in this content, focusing on formality level, emotional tone, and target audience appropriateness.`
```

### Target Different Field

```typescript
target: {
  path: 'voiceAnalysis', // Instead of 'toneOfVoice'
}
```

## Special Requirements

- **AI Assistant feature** must be enabled in your Sanity project
- **Agent Actions** need permission to access hidden & readonly fields
- Set `noWrite: false` in your Agent Action Function for production deployment

## Common Issues

**Error: "Agent Action can't access 'toneOfVoice' field"**

- **Solution:** Configure the Agent Action to access hidden & readonly fields ([docs](https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7))

**Error: "Field 'toneOfVoice' not found in schema"**

- **Solution:** Add the `toneOfVoice` field to your schema and deploy it

**Error: "Cannot find module '@sanity/client'"**

- **Solution:** Run `npm install` in the function directory

## Implementation & Testing

For complete implementation, testing, and deployment instructions, see the [Functions Overview](../README.md).

**Quick Start:**

1. Install: `npx sanity blueprints add function --example capture-tone-of-voice`
2. Follow the [Implementation Guide](../README.md#implementation-guide)
3. Test locally using the [Testing Guide](../README.md#testing-functions-locally)
4. Deploy using the [Deployment Guide](../README.md#deployment-guide)
