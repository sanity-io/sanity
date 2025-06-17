# Tone of Voice Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content creators often need to understand the tone of voice in their content to ensure consistency and alignment with brand guidelines. Manually analyzing tone can be time-consuming and subjective, especially for longer pieces of content.

## Solution

This function automatically analyzes the tone of voice of your content using Sanity's Agent Actions (AI) capabilities. When triggered, it examines the content and saves an analysis of the tone to a field in your schema, making it easy for content creators to understand and maintain consistent voice across their content.

## Benefits

- Saves time by automatically analyzing content tone
- Provides objective feedback on writing style
- Helps maintain consistent brand voice across content
- Stores tone analysis directly in the document for easy reference
- Enables quick review of content tone during editing

## Implementation

1. **Initialize the example**

   For a new project:

   ```bash
   npx sanity blueprints init --example capture-tone-of-voice
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example capture-tone-of-voice
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   defineDocumentFunction({
     name: 'capture-tone-of-voice',
     memory: 2,
     timeout: 60,
     on: ['publish'],
     filter: "_type == 'post',
     projection: '_id',
   })
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Add the required schema field**

   Add a `toneOfVoice` field to your Studio schema:

   ```ts
   defineField({
      name: 'toneOfVoice',
      title: 'Tone of Voice',
      type: 'text',
      readOnly: () => true, // This is optional
    }),
   ```

## Testing the function locally

You can test the capture-tone-of-voice function locally using the Sanity CLI before deploying:

### 1. Basic Function Test

Test with the included sample document:

```bash
npx sanity functions test capture-tone-of-voice --file functions/capture-tone-of-voice/document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test capture-tone-of-voice --data '{
  "_type": "post",
  "_id": "insert-document-id"
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset:

```bash
# Export a real document for testing
npx sanity documents get "document-id" > test-document.json

# Test with the real document
npx sanity functions test tone-of-voice --file test-document.json
```

### 5. Enable Debugging

Add temporary logging to your function:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Tone of Voice:', generateToneOfVoice.toneOfVoice)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Test without external API calls** first when applicable

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `body` field (for content analysis)
  - A `toneOfVoice` field in your schema (type: text, optionally hidden or readonly)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a document is created or updated, the function automatically:

1. Analyzes the content in the `body` field
2. Generates a tone of voice analysis using Sanity's AI (temporarily utilizing the toneOfVoice field)
3. Writes the tone of voice to the capture-tone-of-voice field

This results in an automatic tone analysis that helps content creators maintain consistent voice across their content.

## Customization

### Find the tone of voice on a different field

```typescript
instructionParams: {
	content: {
		type: "field",
		path: "DESIRED_FIELD",
	},
},
```

## Troubleshooting

### Common Issues

**Error: "Cannot find module '@sanity/client'"**

- Cause: Dependencies not installed
- Solution: Run `npm install` in the function directory

**Error: "Field 'toneOfVoice' not found in schema"**

- Cause: Missing schema field
- Solution: Add the `toneOfVoice` field to your schema as described in the Implementation section

**Error: "Agent Action can't access 'toneOfVoice' field"**

- Cause: Agent Action needs permission to access hidden & readonly fields.
- Solution: Configure the Agent Action to be able to access hidden & readonly fields, view [https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7](https://www.sanity.io/docs/agent-actions/agent-action-cheatsheet#e11a6752f9f7)
