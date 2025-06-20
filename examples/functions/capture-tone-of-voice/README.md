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

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the toneOfVoice field to your schema

If you're using the [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean), you'll need to add a `toneOfVoice` field to your post schema:

1. Open `studio/src/schemaTypes/documents/post.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'toneOfVoice',
  title: 'Tone of Voice',
  type: 'text',
  readOnly: () => true, // This is optional
  description: 'Tone of voice analysis will be automatically generated when you publish a post',
}),
```

3. Deploy your updated schema:

```bash
# From the studio/ folder
npx sanity schema deploy
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

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
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
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
   cd functions/capture-tone-of-voice
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

You can test the capture-tone-of-voice function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/capture-tone-of-voice/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test capture-tone-of-voice --file functions/capture-tone-of-voice/document.json
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing post document
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../real-post.json

# Back to project root for function testing
cd ..
npx sanity functions test capture-tone-of-voice --file real-post.json
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
npx sanity functions test capture-tone-of-voice --file test-custom-data.json
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test capture-tone-of-voice --file test-real-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Tone analysis result:', result)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Test without external API calls** first when applicable
- **Create test content** - If you don't have suitable documents, create some test documents first

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (for content analysis)
  - A `toneOfVoice` field in your schema (type: text, optionally hidden or readonly)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a document is created or updated, the function automatically:

1. **Triggers** on the publish event for post documents
2. **Analyzes** the content in the `content` field using Sanity's AI
3. **Generates** a tone of voice analysis
4. **Writes** the tone analysis to the `toneOfVoice` field

**Result:** Content creators get automatic tone analysis that helps maintain consistent voice across their content.

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
