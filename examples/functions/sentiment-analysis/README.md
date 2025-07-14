# Sentiment Analysis Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams manually review thousands of user-generated content pieces (reviews, comments, feedback) to identify sentiment, leading to delayed responses to negative feedback, missed opportunities to amplify positive content, and inconsistent content prioritization across teams.

## Solution

This Sanity Function automatically analyzes sentiment in user-generated content using AI, categorizing it into 5 levels (very_positive, positive, neutral, negative, very_negative) to enable automated workflows and content prioritization.

## Benefits

- **Instant sentiment detection** - Analyze content sentiment in real-time upon publishing
- **Automated workflow triggers** - Route negative feedback to support teams immediately
- **Content prioritization** - Surface positive reviews for marketing and testimonials
- **Consistent categorization** - Standardized 5-level sentiment classification
- **Scalable content moderation** - Handle large volumes of user-generated content
- **Analytics ready** - Track sentiment trends over time with structured data

## Use Cases

- **Customer reviews** - Prioritize negative reviews for immediate response
- **Employee feedback** - Flag concerning team reviews for HR attention
- **Social media comments** - Moderate and respond to user comments based on sentiment
- **Survey responses** - Identify dissatisfied customers for follow-up
- **Support tickets** - Route urgent negative feedback to senior support staff

## Compatible Templates

This function is not directly compatible with our starter templates, but starter templates or any project can be easily modified to work. Common use cases include:

- Review/feedback systems
- Comment sections
- Survey responses
- Team feedback platforms
- Customer testimonials

### Adding the sentiment field to your schema

First you'll need a content type in which to add sentiment to. Common types are 'review', 'comment', and 'feedback'. You'll need to add a `sentiment` field to your chosen content type schema:

1. Open your content document schema (e.g., `studio/src/schemaTypes/documents/review|comment|feedback.ts`)
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'sentiment',
  title: 'Sentiment',
  type: 'string',
  options: {
    list: [
      { title: 'Very Positive', value: 'very_positive' },
      { title: 'Positive', value: 'positive' },
      { title: 'Neutral', value: 'neutral' },
      { title: 'Negative', value: 'negative' },
      { title: 'Very Negative', value: 'very_negative' }
    ]
  },
  description: 'Sentiment will be automatically analyzed when you publish content',
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
   npx sanity blueprints add function --example sentiment-analysis
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'sentiment-analysis',
         src: './functions/sentiment-analysis',
         memory: 2,
         timeout: 30,
         event: {
           on: ['publish'],
           filter: "_type in ['review', 'comment', 'feedback'] && !defined(sentiment)",
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
   cd functions/sentiment-analysis
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

You can test the sentiment-analysis function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since agent actions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/sentiment-analysis/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test sentiment-analysis --file functions/sentiment-analysis/document.json
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing review document
cd studio
npx sanity documents query "*[_type == 'review'][0]" > ../real-review.json

# Back to project root for function testing
cd ..
npx sanity functions test sentiment-analysis --file real-review.json
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
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'review'][0]._id")

# Create a temporary JSON file with custom data in project root
cd ..
cat > test-custom-data.json << EOF
{
  "_type": "review",
  "_id": $REAL_DOC_ID,
  "review": "This product is absolutely terrible. I hate it and want my money back!"
}
EOF

# Test with the custom data file
npx sanity functions test sentiment-analysis --file test-custom-data.json
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'review' && !defined(sentiment)][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test sentiment-analysis --file test-real-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Analyzed sentiment:', result.sentiment)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like content without text or with existing sentiment
- **Check function logs** in CLI output for debugging
- **Test without AI calls** first by setting `noWrite: true` in the function
- **Create test content** - If you don't have reviews without sentiment, create some test documents first
- **Test various sentiment levels** - Try positive, negative, and neutral content

## Requirements

- A Sanity project with Functions enabled
- A schema with user-generated content document types containing:
  - A `review|feedback|comment` field with portable text (for content analysis)
  - A `sentiment` field (for storing analyzed sentiment)
- Access to Sanity's AI capabilities
- Node.js v22.x for local development

## Usage Example

When a user submits new feedback, review, or comment without sentiment analysis, the function automatically:

1. **Triggers** on the publish event for content documents without existing sentiment
2. **Analyzes** the content field using AI to detect emotional tone
3. **Categorizes** sentiment into one of 5 levels (very_positive, positive, neutral, negative, very_negative)
4. **Updates** the document with the analyzed sentiment for workflow automation
5. **Enables** automated routing based on sentiment (e.g., escalate negative feedback)

**Result:** Content teams get instant sentiment analysis without manual effort.

## Customization

- Change the `instruction` string in `index.ts` to adjust the sentiment categories or analysis criteria.
- Modify the `filter` in the blueprint resource to target different document types or conditions.
- Set `noWrite: false` in the function to automatically write the sentiment to the document in production.

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
      name: 'sentiment-analysis',
      src: './functions/sentiment-analysis',
      memory: 2,
      timeout: 30,
      event: {
        on: ['publish'],
        filter: "_type in ['review', 'comment', 'feedback'] && !defined(sentiment)",
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
- Configure the event triggers for document publications
- Make your sentiment-analysis function live in production

**Important:** Be sure to set `noWrite: false` in your Agent Action Function.

3. **Verify deployment**

After deployment, you can verify your function is active by:

- Publishing new user-generated content and confirming the `sentiment` field is populated
- Monitoring function logs in the CLI

### Deployment best practices

- **Test thoroughly first** - Always test your function locally before deploying
- **Avoid recursion** - The sentiment function should not trigger itself when updating the sentiment field
- **Monitor AI usage** - Agent Actions have usage limits and costs. Visit Settings in your Manage console to learn more
- **Use specific filters** - The current filter targets multiple content types. Adjust as needed for your use case
- **Check schema compatibility** - Make sure your `sentiment` field exists in your schema
- **Monitor performance** - This function uses AI processing and may have longer execution times

### Troubleshooting deployment

**Error: "Deploy Studio permission required"**

- Cause: Your account doesn't have deployment permissions for this project
- Solution: Ask a project admin to grant you Deploy Studio permissions

**Error: "Blueprint validation failed"**

- Cause: Issues with your `sanity.blueprint.ts` configuration
- Solution: Check the configuration matches the expected schema

**Function not analyzing sentiment after deployment**

- Cause: Documents may not trigger the function, or AI features may not be enabled
- Solution: Test with new documents and verify AI features are enabled in your project settings

**Error: "AI Assistant feature not enabled"**

- Cause: Your Sanity project doesn't have AI features enabled
- Solution: Enable AI Assistant in your project settings

For more details, see the [official function deployment documentation](https://www.sanity.io/docs/compute-and-ai/function-quickstart).

## Troubleshooting

### Common Issues

**Error: "AI Assistant feature not enabled"**

- Cause: Your Sanity project doesn't have AI features enabled
- Solution: Enable AI Assistant in your project settings

**Error: "Field 'sentiment' not found"**

- Cause: The target field hasn't been added to your schema
- Solution: Add the field to your schema and deploy it

**Error: "Document not found"**

- Cause: Testing with a document ID that doesn't exist in your dataset
- Solution: Use a real document ID from your dataset or create the test document first

**Error: "Error occurred during sentiment analysis"**

- Cause: The AI action may fail if the document is missing a `review|feedback|comment` field or if there are API issues.
- Solution: Ensure the document has a valid `review|feedback|comment` field and check your Sanity project configuration.

## Related Examples

- [Auto-Summary Function](../auto-summary/README.md) – Automatically generate summaries for documents using AI
- [Brand Voice Validator Function](../brand-voice-validator/README.md) – Validate content against brand guidelines
- [Other AI-powered examples](https://github.com/sanity-io/sanity/tree/main/examples)

---
