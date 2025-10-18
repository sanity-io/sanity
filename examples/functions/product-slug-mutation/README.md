# Product Slug Mutation Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

When working with e-commerce products in Sanity, you often need to maintain both a nested slug structure (like `store.slug.current`) and a root-level slug field for easier querying and URL generation. Manually keeping these two slug fields in sync is error-prone and time-consuming, leading to inconsistent URLs and broken links.

While this is a real example, if you're using [Sanity Connect for Shopify](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify) app, it's also a good example of manipulating data in your schema that you might not have control of. Rather than write a custom Sync for your product data, this small change can improve some of the UX that would otherwise be out of your control.

## Solution

This function automatically synchronizes the nested `store.slug.current` field to a root-level `slug.current` field whenever a product document is published. It uses Sanity's document event handlers to trigger on publish events and ensures the root slug is always up-to-date with the store slug.

## Benefits

- **Eliminates manual slug synchronization** - No more forgetting to update both slug fields
- **Prevents broken URLs** - Ensures consistent slug structure across your application
- **Improves query performance** - Root-level slugs are easier to query and index
- **Reduces content management errors** - Automatic synchronization prevents human error
- **Maintains data consistency** - Guarantees both slug fields always match

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

### Adding the tags field to your schema

If you're using the [shopify-online-storefront template](https://github.com/sanity-io/sanity/tree/main/packages/%40sanity/cli/templates/shopify-online-storefront), you'll need to add a `slug` field to your product schema:

1. Open `studio/src/schemaTypes/documents/product.ts`
2. Add this field to the `fields` array:

```typescript
defineField({
  name: 'slug',
  title: 'Slug',
  type: 'slug',
    description: 'This field is automatically synced with store.slug.current',
  readOnly: true, // Since it's managed by the function
}),
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Initialize the example**

   For a new project:

   ```bash
   npx sanity blueprints init --example product-slug-mutation
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example product-slug-mutation
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         src: './functions/product-slug-mutation',
         name: 'product-slug-mutation',
         memory: 1,
         timeout: 10,
         event: {
           on: ['publish'],
           filter: "_type == 'product' && store.slug.current != slug.current",
           projection: '_id',
         },
       }),
       // Other functions
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
   cd functions/product-slug-mutation
   npm install
   cd ../..
   ```

## Testing the function locally

You can test the product-slug-mutation function locally using the Sanity CLI before deploying:

### 1. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

### 2. Test with Custom Data

Given that we assume you already have data or at least test data from doing our e-commerce learn tutorial, we assume you have a product document already, and given products are only created from the Shopify pipeline it makes sense to only modify an existing product document.

Test with your own product document data:

```bash
npx sanity functions test product-slug-mutation --data '{
  "_type": "product",
  "_id": "my-product-123",
  "title": "Test Product",
  "store": {
    "slug": {
      "current": "test-product"
    }
  }
}'
```

### 4. Test with Real Document Data

Capture a real product document from your dataset:

```bash
# Export a real product document for testing
npx sanity documents get "product-id" > test-product.json

# Test with the real document
npx sanity functions test product-slug-mutation --file test-product.json
```

### 5. Enable Debugging

Add temporary logging to your function:

```typescript
// Add debugging logs
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Result:', result)
```

### Testing Tips

- **Use Node.js v22.x** locally to match production runtime
- **Test edge cases** like missing slug fields or malformed data
- **Check function logs** in CLI output for debugging
- **Verify the slug synchronization** by checking both fields after testing

## Requirements

- A Sanity project with Functions enabled
- Ideally a schema with products linked from [Sanity Connect for Shopify](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify)
- Product documents with the following schema structure:
  - `_type: 'product'`
  - `store.slug.current` (string) - The source slug field
  - `slug.current` (string) - The target slug field to be synchronized
- Node.js v22.x or later for local testing

## Usage Example

When a product document is published, the function automatically:

1. **Triggers on publish** - Detects when a product document is published
2. **Checks slug fields** - Verifies both `store.slug.current` and `slug.current` exist
3. **Synchronizes slugs** - Copies the value from `store.slug.current` to `slug.current`
4. **Updates document** - Saves the changes using `setIfMissing` to avoid overwriting existing data

This results in consistent slug structure across your e-commerce application, making it easier to generate URLs and query products by their slugs.

## Customization

### Modifying the Filter Condition

You can customize when the function triggers by modifying the filter condition:

```ts
// Trigger on all product publishes (removes slug comparison)
filter: "_type == 'product'"

// Trigger only when store slug is different from root slug
filter: "_type == 'product' && store.slug.current != slug.current"
```

### Changing the Slug Field Names

If your schema uses different field names, update the interface and logic:

```typescript
interface SanityProduct {
  _type: 'product'
  _id: string
  title: string
  // Change field names to match your schema
  customStore: {
    customSlug: {
      current: string
    }
  }
}
```

### Adding Additional Fields

You can extend the function to synchronize other fields as well:

```typescript
const result = await client.patch(data._id, {
  set: {
    slug: {
      current: data.store.slug.current,
    },
    // Add more field synchronizations
    seoTitle: data.store.title,
    urlPath: `/products/${data.store.slug.current}`,
  },
})
```

## Troubleshooting

### Common Issues

**Error: "Cannot find module '@sanity/client'"**

- Cause: Dependencies not installed
- Solution: Run `npm install` in the function directory

**Error: "Function not triggered on product publish"**

- Cause: Filter condition too restrictive
- Solution: Check that your product documents match the filter condition in the blueprint configuration

**Error: "Slug fields not synchronized"**

- Cause: Missing or malformed slug data
- Solution: Verify that `store.slug.current` exists and contains valid string data

**Error: "Permission denied"**

- Cause: Function lacks write permissions
- Solution: Ensure your Sanity project has Functions enabled and proper permissions configured

### Debugging Steps

1. **Check function logs** in the Sanity dashboard
2. **Verify document structure** matches the expected interface
3. **Test with simple data** to isolate the issue
4. **Review filter conditions** to ensure they match your data

## Related Examples

- [Auto-Tag Function](https://github.com/sanity-io/sanity/tree/main/examples/functions/auto-tag) - Automatically tag documents based on content
- [SEO Field Sync](https://github.com/sanity-io/sanity/tree/main/examples/functions/seo-sync) - Synchronize SEO fields across document types
- [URL Generation](https://github.com/sanity-io/sanity/tree/main/examples/functions/url-generation) - Generate and validate URL structures
