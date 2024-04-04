# Studio features

## Shopify friendly content schema types

This studio is built to accommodate both collections and products coming from a Shopify Store.

You can use the official [Sanity Connect app on Shopify][sanity-shopify] to sync your Shopify collection and products with your dataset. All your data will be available over APIs that you can access with [`@sanity/client`][docs-js-client] or the [HTTP API][docs-http-api].

Inside `/schemaTypes` you'll find schema definitions for all the content types. They are organized in folders:

- `/schemaTypes/annotations/`: Annotations let editors mark up inline text in the block content editor with rich objects. These can be used to augment editorial content with product information.
- `/schemaTypes/documents/`: Document types determines the shape of the JSON documents that's stored in your content lake. This is where you define the content forms for things like collections, products, product variants, as well as articles.
- `/schemaTypes/objects/`: General purpose & re-usable content structures, such as links, custom product options and modules.

## Structure

Sanity Studio will automatically list all your [document types][docs-document-types] out of the box. Sometimes you want a more streamlined editor experience. That's why you'll find a custom [structure][docs-structure] that's defined in `/structure`. It does the following things:

- Groups product information and variants by individual products for more convenient editing
- Creates a singleton document for controlling a homepage with custom editorial modules.
- Creates a singleton document for settings to control navigation and global content
- Lists general purpose pages for other editorial content

## Custom modules

### Call to action

<p><img width="600" src="https://user-images.githubusercontent.com/209129/173630522-1251875d-175d-430a-bdc7-8923ebe08044.png"></p>

`/schemaTypes/objects/module/callToAction.tsx`

### Callout

<p><img width="600"src="https://user-images.githubusercontent.com/209129/173630517-003a6942-b45e-48d4-8ec6-d87365e957c7.png"></p>

`/schemaTypes/objects/module/callout.tsx`

### Collection

<p><img width="600" src="https://user-images.githubusercontent.com/209129/173630535-73eab084-f424-435f-b426-7fbc9baed152.png"></p>

`/schemaTypes/objects/module/collection.tsx`

### Image

<p><img width="600" src="https://user-images.githubusercontent.com/209129/174492490-aefa1a0d-40ea-473d-be73-ba6326d66ee8.png"></p>

`/schemaTypes/objects/module/image.ts`

### Instagram

<p><img width="600" src="https://user-images.githubusercontent.com/209129/173630524-b8b7253f-704a-4935-9b66-1c5673477b1c.png"></p>

`/schemaTypes/objects/module/instagram.ts`

### Product

<p><img width="600" src="https://user-images.githubusercontent.com/209129/173630533-b4a202bd-6385-4eef-a7e2-c67ba596dad1.png"></p>

`/schemaTypes/objects/module/product.tsx`

## Custom document actions

Custom document actions let you override the default behavior of the publish button. The included document actions adds to the menu that you can find by pushing the chevron right to a document's publish button.

You can find these in `/plugins/customDocumentActions/`.

Read more about [document actions][docs-document-actions].

### Delete product and variants

<p><img width="400" src="https://user-images.githubusercontent.com/209129/173621376-66dc614d-a8ef-4d05-9e23-56806bf63a60.png"></p>

`/plugins/customDocumentActions/shopifyDelete.tsx`

Delete a product document including all its associated variants in your Sanity Content Lake. Without this document action, one would have to delete all variant documents one-by-one.

### Edit in Shopify shortcut

<p><img width="280" src="https://user-images.githubusercontent.com/209129/173621897-cfe069e9-4719-4433-b78b-f932d079fce3.png"></p>

`/plugins/customDocumentActions/shopifyLink.ts`

A shortcut to edit the current product or product variant in Shopify in a new window. You'll need to set your Shopify admin domain in `constants.ts`.

## Custom input and preview components

### Placeholder string input

<p><img width="450" alt="image" src="https://user-images.githubusercontent.com/209129/173622133-30b1c1c4-f512-404b-a28f-56ce456e33c8.png"></p>

`/components/inputs/PlaceholderString.tsx`

A simple wrapper around a regular [string input](string-input) that uses the value of another field as a placeholder.

**Usage:**

```javascript
defineField({
  name: 'title',
  type: 'placeholderString',
  options: { field: 'store.title' }
}),
```

### Shopify document status (for collections, products and product variants)

<p><img width="476" src="https://user-images.githubusercontent.com/209129/141304763-8b08d0d8-93d6-4c26-bde3-224857d45468.png" /></p>

`/components/inputs/CollectionHidden.tsx`
`/components/inputs/ProductHidden.tsx`
`/components/inputs/ProductVariantHidden.tsx`

Display-only input fields that show the corresponding document's status in Shopify.

For instance, if a product has been deleted from Shopify or has its status set to `draft` or `active`.

### Proxy string input

<p><img width="450" src="https://user-images.githubusercontent.com/209129/173626714-1e18da84-27ce-46aa-8fc6-b286797544e4.png"></p>

`/components/inputs/ProxyString.tsx`

A simple wrapper around a regular [String input field](string-input) that displays the value of another field as a read-only input.

Since we are using certain product fields from Shopify as the source of truth (such as product title, slug and preview images) and store these in a separate `store` object, these proxy string inputs are used to better surface deeply nested fields to editors.

**Usage**

```javascript
defineField({
  title: 'Slug',
  name: 'slugProxy',
  type: 'proxyString',
  options: {field: 'store.slug.current'},
})
```

### Shopify document status (preview component)

<p><img width="320" alt="image 5" src="https://user-images.githubusercontent.com/209129/173627554-91c60bb4-dac7-460b-b5c6-de45d3cfa9b0.png"></p>

`/components/media/ShopifyDocumentStatus.tsx`

A custom preview component that will display collection, product and product variant images defined in `store.previewImageUrl`.

By default, Sanity Connect will populate these fields with the default image from Shopify. These images are not re-uploaded into your dataset and instead reference Shopify's CDN directly.

This preview component also has visual states for when a product is _unavailable_ in Shopify (e.g. if it has a non-active status), or if it's been removed from Shopify altogether.

Sanity Connect will never delete your collection, product and product variant documents.

[docs-structure]: https://www.sanity.io/docs/structure-builder
[docs-document-actions]: https://www.sanity.io/docs/document-actions
[docs-document-types]: https://www.sanity.io/docs/schema-types
[docs-http-api]: https://www.sanity.io/docs/http-api
[docs-js-client]: https://www.sanity.io/docs/js-client
[sanity-shopify]: https://apps.shopify.com/sanity-connect
