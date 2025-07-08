# Brand Voice Validator Function

**📖 [← Back to Functions Overview](../README.md)**

## Overview

**Problem:** Content creators often struggle to align their writing with brand guidelines and style requirements. Manually reviewing content for tone, structure, and style consistency is time-consuming and subjective, especially when working with multiple authors or large content teams.

**Solution:** This function automatically analyzes your content against brand style guidelines using Sanity's Agent Actions (AI) capabilities. When triggered, it examines the content and generates specific, actionable suggestions for improvement, storing them directly in a field in your schema for easy review and implementation.

**Benefits:**

- **Saves time** by automatically reviewing content against brand guidelines
- **Provides specific, actionable suggestions** for content improvement
- **Helps maintain consistent brand voice** and style across all content
- **Stores suggestions directly in the document** for easy access during editing
- **Enables content teams to learn** and improve their writing over time

## Schema Requirements

Add a `suggestedChanges` field to your post schema:

```typescript
// In your post schema (e.g., studio/src/schemaTypes/documents/post.ts)
defineField({
  name: 'suggestedChanges',
  title: 'Suggested Changes',
  type: 'text',
  readOnly: () => true, // Optional: makes field read-only
  description: 'Content suggestions will be automatically generated when you publish a post',
}),
```

Deploy your schema: `npx sanity schema deploy` (from studio/ folder)

## Implementation

### Step 1: Choose Your Installation Method

For a **new project**:

```bash
npx sanity blueprints init --example brand-voice-validator
```

For an **existing project**:

```bash
npx sanity blueprints add function --example brand-voice-validator
```

### Step 2: Install Dependencies

Install dependencies in the project root:

```bash
npm install @sanity/functions
npm install
```

Install function-specific dependencies:

```bash
cd functions/brand-voice-validator
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
      name: 'brand-voice-validator',
      src: './functions/brand-voice-validator',
      memory: 2,
      timeout: 60,
      event: {
        on: ['publish'],
        filter: "_type == 'post'",
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

When you publish a post document, the function automatically:

1. **Analyzes** the content field against the built-in brand style guide
2. **Generates** specific, actionable suggestions for improvement
3. **Writes** the suggestions to the `suggestedChanges` field in the document
4. **Logs** the successful generation of suggestions

**Result:** Content creators receive immediate feedback on how to improve their writing to match brand guidelines.

## Customization Options

### Modify the Brand Style Guide

Update the `brandsWritingStyleGuide` constant in the function code:

```typescript
const brandsWritingStyleGuide = `
Your custom brand guidelines here:
- Tone: Professional yet approachable
- Voice: Expert but not condescending
- Style: Clear, concise, action-oriented
- Audience: Technical professionals
`
```

### Change the Instruction Prompt

Customize the AI instruction to match your specific requirements:

```typescript
instruction: `Review this content against our brand guidelines and provide specific suggestions for improvement focusing on technical accuracy and clarity.`
```

### Target Different Field

```typescript
target: {
  path: 'contentReview', // Instead of 'suggestedChanges'
}
```

## Special Requirements

- **AI Assistant feature** must be enabled in your Sanity project
- **Agent Actions** need permission to access hidden & readonly fields
- Set `noWrite: false` in your Agent Action Function for production deployment

## Common Issues

**Error: "AI Assistant feature not enabled"**

- **Solution:** Enable AI Assistant in your project settings

**Error: "Field 'suggestedChanges' not found"**

- **Solution:** Add the field to your schema and deploy it

**Error: "Agent Action can't access 'suggestedChanges' field"**

- **Solution:** Configure the Agent Action to access hidden & readonly fields ([docs](https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7))

## Testing & Deployment

For complete testing and deployment instructions, see the [Functions Overview](../README.md):

- **[Testing Guide](../README.md#testing-functions-locally)** - Local testing with sample or real data
- **[Deployment Guide](../README.md#deployment-guide)** - Deploy to production
- **[Troubleshooting](../README.md#troubleshooting)** - Common issues and solutions
