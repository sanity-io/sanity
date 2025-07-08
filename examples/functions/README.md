# Sanity Functions

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

This directory contains examples of [Sanity Functions](https://www.sanity.io/docs/compute-and-ai/functions-introduction) - serverless functions that run in Sanity's cloud environment. Each function demonstrates different use cases and patterns for automating content workflows.

## Available Functions

| Function                                                       | Description                                             | Use Case                                 |
| -------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| [**auto-tag**](./auto-tag/README.md)                           | AI-powered automatic tagging for blog posts             | Content organization and discoverability |
| [**brand-voice-validator**](./brand-voice-validator/README.md) | AI-powered content analysis and improvement suggestions | Content quality and brand consistency    |
| [**capture-tone-of-voice**](./capture-tone-of-voice/README.md) | AI-powered tone of voice analysis and capture           | Content voice consistency                |
| [**first-published**](./first-published/README.md)             | Automatic timestamp tracking for first publication      | Analytics and editorial workflows        |
| [**slack-notify**](./slack-notify/README.md)                   | Automatic Slack notifications when content is published | Team communication and awareness         |

## Getting Started

### Prerequisites

Before working with Sanity Functions, ensure you have:

- **Node.js v22.x** for local development (matches production runtime)
- **Sanity CLI v3.92.0 or later**
- **A Sanity project** with Functions enabled
- **Deploy Studio permissions** for your Sanity project (required for deployment)

### Compatible Templates

All functions in this directory are built to be compatible with [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing functions in one of these templates after installing them locally:

- [nextjs-clean template](https://github.com/sanity-io/sanity-template-nextjs-clean)
- Other clean templates from the [Sanity Exchange](https://www.sanity.io/exchange/type=templates/by=sanity)

## Implementation Guide

### Step 1: Choose Your Installation Method

For a **new project**:

```bash
npx sanity blueprints init --example [function-name]
```

For an **existing project**:

```bash
npx sanity blueprints add function --example [function-name]
```

### Step 2: Install Dependencies

Install dependencies in the project root:

```bash
npm install @sanity/functions
npm install
```

Install function-specific dependencies:

```bash
cd functions/[function-name]
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
      name: 'your-function-name',
      src: './functions/your-function-name',
      memory: 2,
      timeout: 30,
      event: {
        on: ['publish'],
        filter: "_type == 'post' && !defined(targetField)",
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

## Testing Functions Locally

### Basic Function Testing

**Important:** Document functions require that the document ID used in testing actually exists in your dataset.

#### Option 1: Test with Sample Data

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/[function-name]/document.json --replace
cd ..

# Test the function
npx sanity functions test [function-name] --file functions/[function-name]/document.json
```

#### Option 2: Test with Real Documents

```bash
# From the studio/ folder, export an existing document
cd studio
npx sanity documents query "*[_type == 'post'][0]" > ../real-document.json
cd ..

# Test with the real document
npx sanity functions test [function-name] --file real-document.json
```

### Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### Test with Custom Data

For custom testing, you still need a real document ID from your dataset:

```bash
# From the studio/ folder, get a real document ID
cd studio
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'post'][0]._id")
cd ..

# Create custom test data
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
          "text": "Your custom content for testing..."
        }
      ]
    }
  ]
}
EOF

# Test with custom data
npx sanity functions test [function-name] --file test-custom-data.json
```

### Enable Debugging

Add temporary logging to your function for debugging:

```typescript
// Add to your function code
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Function result:', result)
```

### Testing Best Practices

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Test edge cases** - Try missing fields, empty content, etc.
- **Monitor function logs** - Check CLI output for debugging information
- **Create test content** - If you don't have suitable documents, create test documents first

## Deployment Guide

### Prerequisites for Deployment

- **Sanity CLI v3.92.0 or later**
- **Deploy Studio permissions** for your Sanity project
- **Node.js v22.x** (matches production runtime)

### Step 1: Verify Blueprint Configuration

Ensure your `sanity.blueprint.ts` file is properly configured:

```ts
// sanity.blueprint.ts
import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      type: 'sanity.function.document',
      name: 'your-function-name',
      src: './functions/your-function-name',
      memory: 2,
      timeout: 30,
      event: {
        on: ['publish'],
        filter: "_type == 'post'",
        projection: '_id',
      },
    }),
  ],
})
```

### Step 2: Deploy Your Blueprint

From your project root:

```bash
npx sanity blueprints deploy
```

This command will:

- Package your function code
- Upload it to Sanity's infrastructure
- Configure the event triggers
- Make your function live in production

### Step 3: Configure Environment Variables (if needed)

For functions that require secrets or configuration:

```bash
npx sanity functions env add [function-name] VARIABLE_NAME "your-value-here"
```

Verify environment variables:

```bash
npx sanity functions env list [function-name]
```

### Step 4: Verify Deployment

After deployment, verify your function is active by:

- Publishing a test document and checking the results
- Monitoring function logs: `npx sanity functions logs [function-name]`
- Checking the Sanity Studio under "Compute"

### Deployment Best Practices

- **Test thoroughly first** - Always test locally before deploying
- **Avoid infinite loops** - Be careful with functions that modify documents they're triggered by
- **Monitor AI usage** - Agent Actions have usage limits and costs
- **Use specific filters** - Avoid unnecessary function executions with precise filters
- **Monitor performance** - Check function execution times and memory usage

## Environment Variables

Functions can access environment variables for configuration and secrets:

### Adding Environment Variables

```bash
npx sanity functions env add [function-name] VARIABLE_NAME "value"
```

### Accessing in Function Code

```typescript
// In your function code
const apiKey = process.env.API_KEY
const config = process.env.CONFIG_VALUE
```

### Common Environment Variables

- **API keys** for external services
- **Configuration values** (URLs, channel names, etc.)
- **Feature flags** for conditional behavior

Learn more: [Function Environment Variables Documentation](https://www.sanity.io/docs/compute-and-ai/function-env-vars)

## Troubleshooting

### Common Issues

**Error: "Deploy Studio permission required"**

- **Cause**: Your account doesn't have deployment permissions
- **Solution**: Ask a project admin to grant you Deploy Studio permissions

**Error: "Blueprint validation failed"**

- **Cause**: Issues with your `sanity.blueprint.ts` configuration
- **Solution**: Check the configuration matches the expected schema

**Error: "Document not found"**

- **Cause**: Testing with a document ID that doesn't exist
- **Solution**: Use a real document ID from your dataset or create the test document first

**Error: "AI Assistant feature not enabled"**

- **Cause**: Your Sanity project doesn't have AI features enabled
- **Solution**: Enable AI Assistant in your project settings

**Error: "Function timeout"**

- **Cause**: Function execution exceeds the configured timeout
- **Solution**: Increase timeout in blueprint configuration or optimize function code

**Error: "Memory limit exceeded"**

- **Cause**: Function uses more memory than allocated
- **Solution**: Increase memory allocation or optimize function code

**Functions not triggering after deployment**

- **Cause**: Event filters may be too restrictive, or documents don't match criteria
- **Solution**: Check your filter logic and test with documents that should trigger

### Debugging Steps

1. **Check function logs**: `npx sanity functions logs [function-name]`
2. **Test locally first**: Always test functions locally before deployment
3. **Verify event data**: Log the event data to understand what's being passed
4. **Check permissions**: Ensure proper permissions for Studio deployment and AI features
5. **Monitor execution**: Watch function performance and execution times

### Getting Help

- [Sanity Functions Documentation](https://www.sanity.io/docs/compute-and-ai/functions-introduction)
- [Function Quickstart Guide](https://www.sanity.io/docs/compute-and-ai/function-quickstart)
- [Sanity Community](https://www.sanity.io/community)
- [GitHub Issues](https://github.com/sanity-io/sanity/issues)

---

## Next Steps

1. **Choose a function** from the table above that matches your use case
2. **Read the function-specific README** for detailed implementation instructions
3. **Test locally** using the instructions in this guide
4. **Deploy to production** following the deployment guide
5. **Monitor and iterate** based on your specific needs

Each function directory contains specific documentation for that function's unique features and customization options.
