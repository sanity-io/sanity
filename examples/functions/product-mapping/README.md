# Product Mapping Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

E-commerce teams need to organize products into logical groups and manage color variants, but manually creating product maps and color variants for each product based on Shopify tags is time-consuming and error-prone. This creates inconsistencies in product organization and variant management. Many commerence teams already have access to this automation either via csv uploads or via configuration in the warehouse.

## Solution

This Sanity Function automatically processes Shopify product tags to create product maps and color variants when products are created or updated. When a product has tags starting with `sanity-parent-` or `sanity-color-`, the function automatically creates or updates the corresponding productMap and colorVariant documents, then links them back to the product.

## Benefits

- **Automated product organization** by creating product maps from Shopify tags
- **Consistent color variant management** by automatically creating color variants
- **Reduces manual work** by eliminating the need to manually create product relationships
- **Scalable product management** as your product catalog grows
- **Tag-driven workflow** that integrates seamlessly with Shopify product management

## Compatible Templates

This function is built to be compatible with the Sanity E-commerce Shopify template.. It works specifically with Shopify product data and requires the `product`, `productMap`, and `colorVariant` document types. Install Sanity's Shopify template: `npm create sanity@latest -- --template shopify`

## How it works with Sanity Connect for Shopify

This function works directly with [Sanity Connect for Shopify](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify) to automatically process product data as it syncs from your Shopify store. When Shopify products are created or updated through Sanity Connect, this function:

1. **Listens for product events** - Automatically triggers when products are created or updated via Sanity Connect
2. **Processes Shopify tags** - Reads tags from the synced product data
3. **Creates product maps** - Generates `productMap` documents from tags starting with `sanity-parent-`
4. **Creates color variants** - Generates `colorVariant` documents from tags starting with `sanity-color-`
5. **Links relationships** - Automatically references the created documents back to the product

### Tag Processing Examples

- Tag: `sanity-parent-summer-collection` → Creates/updates productMap: "summer-collection"
- Tag: `sanity-color-blue` → Creates/updates colorVariant: "blue"
- Tag: `sanity-parent-winter-jackets` → Creates/updates productMap: "winter-jackets"

The function ensures that your Sanity dataset stays organized and up-to-date with your Shopify product catalog automatically.

### Adding required schema types to your project

If you're using the Sanity E-commerce template, you'll need to add the `productMap` and `colorVariant` schema types:

1. Create `schemaTypes/productMap.ts`:

```typescript
import {defineField, defineType} from 'sanity'

export const productMapType = defineType({
  name: 'productMap',
  title: 'Product Map',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'product'}],
        },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'careInstructions',
      title: 'Care Instructions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Add care instructions for the products',
    }),
  ],
})
```

2. Create `schemaTypes/colorVariant.ts`:

```typescript
import {defineField, defineType} from 'sanity'

export const colorVariantType = defineType({
  name: 'colorVariant',
  title: 'Color Variant',
  type: 'document',
  fields: [
    defineField({
      name: 'colorName',
      title: 'Color Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'colorValue',
      title: 'Color',
      type: 'color',
      description: 'Pick a solid color',
    }),
    defineField({
      name: 'pattern',
      title: 'Pattern Image',
      type: 'image',
      description: 'Upload a pattern image instead of selecting a solid color',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: 'colorName',
      media: 'pattern',
      color: 'colorValue',
    },
    prepare({title, media, color}: {title: any; media: any; color: any}) {
      return {
        title,
        media:
          media ||
          (color?.hex
            ? {
                _type: 'color',
                hex: color.hex,
              }
            : null),
      }
    },
  },
})
```

3. Add the new types to your schema in `sanity.config.ts`:

```typescript
import {productMapType} from './schemaTypes/productMap'
import {colorVariantType} from './schemaTypes/colorVariant'

export default defineConfig({
  // ... other config
  schema: {
    types: [
      // ... your existing types
      productMapType,
      colorVariantType,
    ],
  },
})
```

4. You'll also need to add references to these new types in your existing `product` schema. Add these fields to your product schema:

```typescript
defineField({
  name: 'productMap',
  title: 'Product Map',
  type: 'reference',
  to: [{type: 'productMap'}],
  description: 'Automatically populated by the product-mapping function',
}),
defineField({
  name: 'colorVariant',
  title: 'Color Variant',
  type: 'reference',
  to: [{type: 'colorVariant'}],
  description: 'Automatically populated by the product-mapping function',
}),
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
   npx sanity blueprints add function --example product-mapping
   ```

2. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'product-mapping',
         memory: 1,
         timeout: 10,
         src: './functions/product-mapping',
         event: {
           on: ['create', 'update'],
           filter: "_type == 'product' && delta::changedAny(store.tags)",
           projection:
             '{_id, _type, store, colorVariant, productMap, "operation": delta::operation()}',
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
   cd functions/product-mapping
   npm install
   cd ../..
   ```

4. **Add the required schema types**

   Follow the instructions in the "Compatible Templates" section above to add the `productMap` and `colorVariant` schema types to your project.

5. **Deploy your schema**

   From the studio folder, deploy your updated schema:

   ```bash
   # From the studio/ folder (adjust path as needed for template structure)
   cd studio
   npx sanity schema deploy
   cd ..
   ```

## Testing the function locally

You can test the product-mapping function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### Testing with Real Shopify Products (Recommended)

The best way to test this function is with actual products from your Shopify store that have been synced through Sanity Connect:

#### 1. Set up products in Shopify with the required tags

In your Shopify admin, create or edit products and add tags with the required prefixes:

```
sanity-parent-summer-collection
sanity-color-blue
sanity-parent-winter-jackets
sanity-color-red
```

#### 2. Sync products through Sanity Connect

After adding the tags in Shopify:

1. Save the product in Shopify
2. The product will automatically sync to your Sanity dataset via Sanity Connect
3. The product-mapping function will automatically trigger and process the tags

#### 3. Verify the function worked

Check your Sanity Studio to confirm:

- New `productMap` documents were created (e.g., "summer-collection", "winter-jackets")
- New `colorVariant` documents were created (e.g., "blue", "red")
- The original product now has references to these new documents

#### 4. Test function updates

To test the update functionality:

1. Edit the product tags in Shopify (add new `sanity-parent-` or `sanity-color-` tags)
2. Save the product in Shopify
3. Sanity Connect will sync the changes
4. The function will process the new tags and update/create the corresponding documents

### Alternative CLI Testing (Optional)

If you prefer to test using the Sanity CLI instead of Shopify Connect, you can use the following methods:

#### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test product first:

```bash
# From the studio/ folder, create a test product with tags
cd studio
cat > test-product.json << EOF
{
  "_type": "product",
  "title": "Test Product with Tags",
  "store": {
    "tags": ["sanity-parent-summer-collection", "sanity-color-blue", "cotton", "t-shirt"],
    "slug": {
      "current": "test-product-tags"
    }
  }
}
EOF

npx sanity documents create test-product.json --replace

# Back to project root for function testing
cd ..
npx sanity functions test product-mapping --file studio/test-product.json --dataset production --with-user-token
```

**Alternative:** Test with a real product from your dataset:

```bash
# From the studio/ folder, find and export an existing product
cd studio
npx sanity documents query "*[_type == 'product'][0]" > ../real-product.json

# Back to project root for function testing
cd ..
npx sanity functions test product-mapping --file real-product.json --dataset production --with-user-token
```

#### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

#### 3. Test with Custom Data

For custom data testing, you still need to use a real document ID that exists in your dataset:

```bash
# From the studio/ folder, create or find a real document ID
cd studio
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'product'][0]._id" | tr -d '"')

# Create a temporary JSON file with custom data in project root
cd ..
cat > test-custom-product.json << EOF
{
  "_type": "product",
  "_id": "$REAL_DOC_ID",
  "title": "Custom Test Product",
  "store": {
    "tags": ["sanity-parent-winter-collection", "sanity-color-red", "wool", "sweater"],
    "slug": {
      "current": "custom-test-product"
    }
  }
}
EOF

# Test with the custom data file
npx sanity functions test product-mapping --file test-custom-product.json --dataset production --with-user-token
```

#### 4. Test with Real Document Data

The most reliable approach is to test with existing products from your dataset:

```bash
# From the studio/ folder, find and export a product that has tags
cd studio
npx sanity documents query "*[_type == 'product' && defined(store.tags)][0]" > ../test-real-product.json

# Back to project root for function testing
cd ..
npx sanity functions test product-mapping --file test-real-product.json --dataset production --with-user-token
```

#### 5. Enable Debugging

The function includes comprehensive logging. Check the output for:

```typescript
// Function logs include:
console.log('👋 Your Sanity Function was called at', new Date().toISOString())
console.log('🏷️ Processing tags for product:', _id, 'Tags:', tags)
console.log('✅ Created productMap:', productMapName, 'with ID:', newProductMap._id)
console.log('✅ Created colorVariant:', colorName, 'with ID:', newColorVariant._id)
```

### Testing Tips

- **Test with real Shopify products** - Use actual products synced through Sanity Connect for the most realistic testing
- **Use the correct tag format** - Ensure your Shopify tags start with `sanity-parent-` or `sanity-color-`
- **Monitor function logs** - Check the Sanity Functions logs to see the processing in real-time
- **Verify in Sanity Studio** - Always check your Studio to confirm documents were created correctly
- **Test both create and update scenarios** - Add tags to new products and modify tags on existing products
- **Use real document IDs** - For CLI testing, document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Check function logs** for detailed processing information. `npx sanity functions logs product-mapping`
- **Create test content** - If you don't have suitable products, create some test products with tags first

## Requirements

- A Sanity project with Functions enabled
- The Sanity E-commerce template with schema types:
  - `product` document type with `store.tags` field (existing)
  - `productMap` document type (add using schema above)
  - `colorVariant` document type (add using schema above)
  - Updated `product` schema with `productMap` and `colorVariant` reference fields
- Shopify products with tags formatted as:
  - `sanity-parent-{name}` for product maps
  - `sanity-color-{name}` for color variants
- Node.js v22.x for local development

## Usage Example

When a product is created or updated with specific Shopify tags, the function automatically:

1. **Triggers** on create/update events for product documents
2. **Extracts** tags from the product's `store.tags` field
3. **Processes** `sanity-parent-` tags to create or update product maps
4. **Processes** `sanity-color-` tags to create color variants
5. **Updates** the product with references to the created documents

**Sample input document:**

```json
{
  "_type": "product",
  "_id": "product-123",
  "title": "Summer Cotton T-Shirt",
  "store": {
    "tags": ["sanity-parent-summer-collection", "sanity-color-blue", "cotton", "t-shirt", "casual"],
    "slug": {
      "current": "summer-cotton-t-shirt"
    }
  }
}
```

**Result:**

- A `productMap` document with ID `productMap-summer-collection` is created/updated
- A `colorVariant` document with ID `colorVariant-blue` is created
- The product is updated with references to both documents

## Customization

### Modify Tag Prefixes

Update the tag prefixes by modifying the filter conditions:

```typescript
// Change the parent tag prefix
const parentTags = tags.filter((tag) => tag.startsWith('custom-parent-'))
const productMapName = tag.replace('custom-parent-', '')

// Change the color tag prefix
const colorTags = tags.filter((tag) => tag.startsWith('custom-color-'))
const colorName = tag.replace('custom-color-', '')
```

### Add Additional Document Types

Extend the function to create additional document types based on other tag patterns:

```typescript
// Process category tags
const categoryTags = tags.filter((tag) => tag.startsWith('sanity-category-'))
for (const tag of categoryTags) {
  const categoryName = tag.replace('sanity-category-', '')
  // Create category documents...
}
```

### Modify Document Structure

Customize the created document structure:

```typescript
const newProductMap = await client.create({
  _id: productMapId,
  _type: 'productMap',
  id: productMapName,
  products: [{_key: `product-${_id}`, _ref: _id, _type: 'reference'}],
  description: `Product map for ${productMapName}`,
  careInstructions: [],
  // Add custom fields
  category: 'auto-generated',
  createdAt: new Date().toISOString(),
})
```

### Handle Different Tag Formats

Modify tag processing to handle different formats:

```typescript
// Handle comma-separated tags in a single string
if (typeof store.tags === 'string') {
  tags = store.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

// Handle pipe-separated tags
if (typeof store.tags === 'string') {
  tags = store.tags
    .split('|')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}
```

## Troubleshooting

### Common Issues

**Error: "No tags found for product"**

- Cause: The product doesn't have any tags in the `store.tags` field
- Solution: Add tags to your Shopify products or ensure tags are syncing properly

**Error: "Tags format not recognized"**

- Cause: Tags are in an unexpected format (not array or comma-separated string)
- Solution: Check your Shopify integration and ensure tags are formatted correctly

**Error: "Failed to create productMap/colorVariant"**

- Cause: Document creation failed due to schema validation or permissions
- Solution: Verify your schema includes the required document types and check function permissions

**Function processes products but no documents are created**

- Cause: Products don't have tags with the expected prefixes
- Solution: Ensure your Shopify products have tags starting with `sanity-parent-` or `sanity-color-`

**Duplicate products in productMap**

- Cause: Function ran multiple times on the same product
- Solution: The function includes duplicate prevention, but check your triggers and filters

## Related Examples

- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
- [Slack Notify Function](../slack-notify/README.md) - Send notifications when products are processed
