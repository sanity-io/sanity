# Format code blocks with Prettier

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Without enforced code formatting, code blocks in content can be inconsistently rendered.

## Solution

This Sanity Function formats code blocks with [Prettier](https://prettier.io/) when a document is published and code blocks have been modified. The formatter uses the `language` value of the code block to determine the parser.

## Benefits

- **Improves content quality** by ensuring consistent code formatting across all documents
- **Removes overhead** of manually formatting code blocks

## Requirements

- A Sanity project with Functions enabled
- The [Code Input](https://www.sanity.io/plugins/code-input) plugin installed
- A schema with a `post` document type containing:
  - A `content` field containing `code` blocks
  - These document types and field names can be configured in the `filter` and `projection` configuration
- Node.js v22.x for local development

### Schema Requirements

This function expects your schema to include a `post` document type with:

- A `content` array of `block` type fields
- A `code` block field using the [Code Input](https://www.sanity.io/plugins/code-input) plugin

Example schema definition:

```ts
import {defineType, defineArrayMember} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'code'}),
        // Add other block types as needed
      ],
    },
    // Add other fields as needed
  ],
})
```

## Usage Example

When a `post` type document is published and code blocks have been modified, the function automatically:

1. **Triggers** on the publish event for `post` type documents
2. **Checks** if the `content` field is defined and contains `code` blocks (using filter)
3. **Formats** the `code` blocks with Prettier using the `language` value of the code block to determine the parser

**Result:** Code blocks are formatted with Prettier and saved back to the document.

## Implementation

1. **Initialize the example**

Run this if you haven't initialized blueprints:

```bash
npx sanity blueprints init
```

You'll be prompted to select your organization and Sanity studio.

Then run:

```bash
npx sanity blueprints add function --example prettier-format-code
```

2. **Add configuration to your blueprint**

```ts
// sanity.blueprint.ts
import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  // ...all other settings
  resources: [
    //...all other functions
    defineDocumentFunction({
      name: 'prettier-format-code',
      event: {
        on: ['create', 'update'],
        filter: '_type == "post" && delta::changedAny(content[_type == "code"])',
        projection: '{_id, content}',
      },
    }),
  ],
})
```

3. **Install dependencies**

```bash
npm install
```

## Testing the function locally

You can test the telegram-notify function locally using the Sanity CLI before deploying:

### 1. Basic Function Test

Test with the included sample document:

```bash
npx sanity functions test telegram-notify --file document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test prettier-format-code --data '{
  "_id": "505d8c4e-93b0-436d-8c34-ca0acf96a0b4",
  "_type": "post",
  "content": [
    {
      "_key": "7343c346d8cd",
      "_type": "code",
      "code": "const pets ={\n  schnauzers: ['heidi', \n               'kokos'],\n}\n",
      "language": "typescript"
    }
  ]
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset:

```bash
# Export a real document for testing
npx sanity documents get "your-post-id" > document.json

# Test with the real document
npx sanity functions test prettier-format-code --file document.json
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Check function logs** in CLI output for debugging

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

**Important:** Make sure you have the Deploy Studio permission for your Sanity project before attempting to deploy.

### Prerequisites for deployment

- Sanity CLI v3.92.0 or later
- Deploy Studio permissions for your Sanity project
- Node.js v22.x (matches production runtime)

### Deploy to production

1. **Deploy your blueprint**

From your project root, run:

```bash
npx sanity blueprints deploy
```

This command will:

- Package your function code
- Upload it to Sanity's infrastructure
- Configure the event triggers for post publications
- Make your prettier-format-code function live in production

2. **Verify deployment**

After deployment, you can verify your function is active by:

- Publishing a new post and confirming code blocks are formatted
- Monitoring function logs in the CLI

```bash
npx sanity functions logs prettier-format-code
```
