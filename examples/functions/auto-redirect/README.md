# Auto Redirect Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

When a slug changes people may still try to access content from using the old slug. We also want the SEO ranking to be passed to the new URL. Content creators spend time manually creating redirects which could be prone to error.

## Solution

This Sanity function automatically creates a redirect document when the value of the `slug` field is updated and stores it as a permanent redirect.

## Benefits

- **Ensures content availability** by keeping old urls alive
- **Reduce errors** by using the old and new slugs directly
- **Reduces manual work** by automatically creating the redirect document

## Compatible Templates

This function is built to be compatible with the schema for Next.js as described in [Managing redirects with Sanity guide](https://www.sanity.io/guides/managing-redirects-with-sanity#d012060db974).

```ts
// schemas/redirect.ts
import {defineType, defineField, type Rule, type Slug} from 'sanity'

// Shared validation for our redirect slugs
const slugValidator = (rule: Rule) =>
  rule.required().custom((value: Slug) => {
    if (!value || !value.current) return "Can't be blank"
    if (!value.current.startsWith('/')) {
      return 'The path must start with a /'
    }
    return true
  })

export const redirectType = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  description: 'Redirect for next.config.js',
  fields: [
    defineField({
      name: 'source',
      type: 'slug',
      validation: (rule: Rule) => slugValidator(rule),
    }),
    defineField({
      name: 'destination',
      type: 'slug',
      validation: (rule: Rule) => slugValidator(rule),
    }),
    defineField({
      name: 'permanent',
      type: 'boolean',
    }),
  ],
  // null / false makes it temporary (307)
  initialValue: {
    permanent: true,
  },
})
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
 npx sanity blueprints add function --example auto-redirect
```

2. **Add configuration to your blueprint**

```ts
// sanity.blueprint.ts
import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      type: 'sanity.function.document',
      name: 'auto-redirect',
      src: './functions/auto-redirect',
      memory: 2,
      timeout: 30,
      event: {
        on: ['update'],
        filter: 'delta::changedAny(slug.current)',
        projection: '{"beforeSlug": before().slug.current, "slug": after().slug.current}',
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

4. **Make sure you have a schema deployed**

   From the studio folder, run:

   ```bash
   # In the studio/ folder (adjust path for template structure)
   npx sanity schema deploy
   ```

## Testing the function locally

You can test the auto-redirect function locally using the Sanity CLI before deploying it to production.

**As the filter and projection are using advanced GROQ functions they currently need to be commented out when testing locally**
As this function uses the `before()` and `after()` functions you need to test the function with the included document.json or by using the development server

### 1. Basic Function Test

To test using the cli

```bash
# Back to project root for function testing
npx sanity functions test auto-redirect --file functions/auto-redirect/document.json --with-user-token
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data

### 3. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Result:', result)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing fields or unexpected data
- **Check function logs** in CLI output for debugging
- **Create test content** - If you don't have suitable documents, create some test documents first

## Requirements

- A Sanity project
- A Schema with `redirect` document type containing:
  - A `source` field of type `slug`
  - A `destination` field of type `slug`
  - A `permanent` field of type `boolean`
- Any other document with a `slug` field of type `slug`
- Node.js v22.x for local development

## Usage Example

When a content editor publishes a document with a changed slug field, the function automatically:

1. **Triggers** on the publish event for a document with a changed slug field
2. **Analyzes** the changes to get the old and new slugs
3. **Checks** the existing redirects to see if one exists or it a loop will be created
4. **Creates** a new redirect document

This results in SEO rankings being passed on and old links still working.

## Customization

### Adjust Document Types

Modify the blueprint filter to target specific content types:

```typescript
filter: "_type == 'article' && delta::changedAny(slug.current)"
```

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
