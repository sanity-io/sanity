# Content Suggestions Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content creators often struggle to align their writing with brand guidelines and style requirements. Manually reviewing content for tone, structure, and style consistency is time-consuming and can be subjective, especially when working with multiple authors or large content teams.

## Solution

This function automatically analyzes your content against brand style guidelines using Sanity's Agent Actions (AI) capabilities. When triggered, it examines the content and generates specific, actionable suggestions for improvement, storing them directly in a field in your schema for easy review and implementation.

## Benefits

- Saves time by automatically reviewing content against brand guidelines
- Provides specific, actionable suggestions for content improvement
- Helps maintain consistent brand voice and style across all content
- Stores suggestions directly in the document for easy access during editing
- Enables content teams to learn and improve their writing over time

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the suggestedChanges field to your schema

If you're using the [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean), you'll need to add a `suggestedChanges` field to your post schema:

1. Open `studio/src/schemaTypes/documents/post.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'suggestedChanges',
  title: 'Suggested Changes',
  type: 'text',
  readOnly: () => true, // This is optional
  description: 'Content suggestions will be automatically generated when you publish a post',
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

   Run this if you haven't initlized blueprints:

   ```bash
   npx sanity blueprints init
   ```

You'll be prompted to select your organization and Sanity studio.

Then run:

```bash
npx sanity blueprints add function --example brand-voice-validator
```

2. **Add configuration to your blueprint**

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

3. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install @sanity/functions
   npm install
   ```

   And install function dependencies:

   ```bash
   cd functions/brand-voice-validator
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

You can test the brand-voice-validator function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/brand-voice-validator/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test brand-voice-validator --file functions/brand-voice-validator/document.json
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing post document
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../real-post.json

# Back to project root for function testing
cd ..
npx sanity functions test brand-voice-validator --file real-post.json
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
          "text": "Your custom blog post content here for testing suggestions..."
        }
      ]
    }
  ]
}
EOF

# Test with the custom data file
npx sanity functions test brand-voice-validator --file test-custom-data.json
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test brand-voice-validator --file test-real-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Result:', result)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Test without external API calls** first when applicable
- **Create test content** - If you don't have suitable documents, create some test documents first

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.93.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)

### Deploy to production

1. **Verify your blueprint configuration**

Make sure your `sanity.blueprint.ts` file is properly configured with your function:

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

2. **Deploy your blueprint**

From your project root, run:

```bash
npx sanity blueprints deploy
```

This command will:

- Package your function code
- Upload it to Sanity's infrastructure
- Configure the event triggers for post publications
- Make your brand-voice-validator function live in production

**Important:** Be sure to set `noWrite: false` in your Agent Action Function.

3. **Verify deployment**

After deployment, you can verify your function is active by:

- Publishing a new post and confirming the `suggestedChanges` field is populated
- Monitoring function logs in the CLI

### Deployment best practices

- **Test thoroughly first** - Always test your function locally before deploying
- **Avoid recursion** - When the `suggestedChanges` function runs, it writes changes to the same document's `suggestedChanges` field but **does not** publish the document. Be sure not to add `skipforcePublishedWrite: true,` to your index.ts's agent.action.generate function, as this will create an infinite loop
- **Monitor AI usage** - Agent Actions have usage limits and costs. Visit Settings in your Manage console to learn more
- **Use specific filters** - The current filter targets all posts. To avoid unnecessary executions, setup additional logic to trigger this function only when certain criteria is met
- **Check schema compatibility** - Make sure your `suggestedChanges` field exists in your schema
- **Monitor performance** - This function uses AI processing and may have longer execution times

### Troubleshooting deployment

**Error: "Deploy Studio permission required"**

- Cause: Your account doesn't have deployment permissions for this project
- Solution: Ask a project admin to grant you Deploy Studio permissions

**Error: "Blueprint validation failed"**

- Cause: Issues with your `sanity.blueprint.ts` configuration
- Solution: Check the configuration matches the expected schema

**Function not generating suggestions after deployment**

- Cause: Posts may not trigger the function, or AI features may not be enabled
- Solution: Test with new posts and verify AI features are enabled in your project settings

**Error: "AI Assistant feature not enabled"**

- Cause: Your Sanity project doesn't have AI features enabled
- Solution: Enable AI Assistant in your project settings

For more details, see the [official function deployment documentation](https://www.sanity.io/docs/compute-and-ai/function-quickstart).

## Requirements

- A Sanity project with the AI Assistant feature enabled
- A post schema with a `content` field (rich text/portable text)
- A `suggestedChanges` field added to your post schema (text type)
- Node.js v22.x for local testing

## Usage Example

When you publish a post document, the function automatically:

1. Analyzes the content field against the built-in brand style guide
2. Generates specific, actionable suggestions for improvement
3. Writes the suggestions to the `suggestedChanges` field in the document
4. Logs the successful generation of suggestions

This results in content creators having immediate feedback on how to improve their writing to match brand guidelines.

## Customization

You can customize the brand style guide by modifying the `brandsWritingStyleGuide` constant in the function code. The current guide focuses on:

- Casual yet professional tone
- Clear and engaging language
- Proper structure and formatting
- Audience-appropriate content

To modify the style guide:

1. Edit the `brandsWritingStyleGuide` variable in `index.ts`
2. Update the instruction prompt to match your specific requirements
3. Test the function with your custom guidelines

## Troubleshooting

### Common Issues

**Error: "AI Assistant feature not enabled"**

- Cause: Your Sanity project doesn't have AI features enabled
- Solution: Enable AI Assistant in your project settings

**Error: "Field 'suggestedChanges' not found"**

- Cause: The target field hasn't been added to your schema
- Solution: Add the field to your schema and deploy it

**Error: "Document not found"**

- Cause: Testing with a document ID that doesn't exist in your dataset
- Solution: Use a real document ID from your dataset or create the test document first
