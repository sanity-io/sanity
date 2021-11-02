# Sanity Studio for Shopify Projects

<p><img src="https://user-images.githubusercontent.com/209129/141306762-2cd2c6a1-2016-4a0c-b3a4-b0c8ff114625.png" width="800" /></p>

- [About](#about)
- [Features](#features)
  - [Shopify friendly content schemas](#shopify-friendly-content-schemas)
  - [Desk structure](#desk-structure)
  - [Custom document actions](#custom-document-actions)
  - [Delete product and variants](#delete-product-and-variants)
  - [Edit in Shopify shortcut](#edit-in-shopify-shortcut)
  - [Bundled custom input components](#bundled-custom-input-components)
- [Assumptions](#assumptions)
- [Setup](#setup)
- [Local Development](#local-development)
  - [Starting development server](#starting-development-server)
  - [Deploying the studio](#deploying-the-studio)
  - [Upgrading Sanity Studio](#upgrading-sanity-studio)
- [License](#license)

## About

This Sanity Studio is configured for headless Shopify projects that use the official [Sanity Connect app][sanity-shopify]. It will let you augment extend product information with additional content, as well as integrate products with editoral content. This studio also contains example of customization of your [desk structure][desk-structure], [document actions][document-actions], as well as [input components][input-components].

This studio can be used with our [Hydrogen starter][hydrogen-demo], your own frontend, or anywhere else you want your e-commerce content to go.

## Features

### Shopify friendly content schemas

This studio is built to accommodate product information coming from a Shopify Store. You can use the official [Sanity Connect app on Shopify][sanity-shopify] to sync your product information, add content on top of it and integrate with editorial content. All your data will be available over APIs that you can access with [`@sanity/client`][sanity-client] or the [HTTP API][http-api-docs]. If you're using Hydrogen, there's also an [official plugin][hydrogen-plugin] available.

Inside `/schemas` you'll find schema definitions for all the content types. They are organized in folders:

- `/schemas/annotations/`: Annotations let editors mark up inline text in the block content editor with rich objects. These can be used to agument editorial content with product information. It also uses referential integrity to keep you from unwillingly delete a product that's used in editorial content.
- `/schemas/documents/`: Document types determines the shape of the JSON documents that's stored in your content lake. This is where you define the content forms for things like products, collections, variants, as well as articles.
- `/schemas/objects/`: General purpose & re-usable content structures, such as links (`linkExternal`, `linkInternal`), `productOption` and `blockImage`.

### Desk structure

Sanity Studio will automatically list all your [document types][document-types] out of the box. Sometimes you want a more streamlined editor experience. That's why you'll find a custom [desk-structure][desk-structure] that's defined in `/deskStructure.js`. It does the following things:

- Groups product information and variants by individual products for more convenient editing
- Creates a singleton document for controlling a homepage with featured products and collections, and a gallery
- Creates a singleton document for settings to control naviagation and global content
- Lists article types for information and for editorial content

### Custom document actions

Custom document actions let you override the default behavior of the publish button. The included document actions adds to the menu that you can find by pushing the chevron right to a document's publish button.

You can find these in `/documentActions/`.

Read more about [document actions][document-actions].

#### Delete product and variants

`/documentActions/deleteProductAndVariants.tsx`

Delete a product document including all its associated variants in your Sanity Content Lake. Without this document action, one would have to delete all variant document one-by-one.

<details><summary>Preview</summary><img src="https://user-images.githubusercontent.com/209129/141300139-00fe450b-bfcc-44f5-84d8-cd0fe0d29e10.png" width="500" /></details>

#### Edit in Shopify shortcut

`/documentActions/shopifyLink.ts`

A shortcut to edit the current product or product variant in Shopify in a new window.

<details><summary>Preview</summary><img src="https://user-images.githubusercontent.com/209129/141300887-793de67b-4293-4a4d-b590-0a6f18b95314.png" width="300" /></details>

### Bundled custom input and preview components

#### Placeholder string input

`/components/inputs/PlaceholderString.tsx`

A simple wrapper around a regular [string input](string-input) that uses the value of another field as a placeholder.

<details><summary>Example usage</summary>
<p>

```javascript
{
  name: 'title',
  title: 'Title',
  type: 'placeholderString',
  options: { field: 'store.title' }
},
```

</p>
</details>

<details><summary>Preview</summary><img width="600" src="https://user-images.githubusercontent.com/209129/141304183-0f31852a-d7c4-45e9-a601-2728fa87ba28.png" /></details>

#### Product (and Product Variant) status

`/components/inputs/ProductHidden.tsx`  
`/components/inputs/ProductVariantHidden.tsx`

Display-only input fields that show the corresponding product (or product variant) status in Shopify.

For instance, if it's been deleted from Shopify or has its status set to `draft` or `active`.

<details><summary>Preview</summary><img width="476"  src="https://user-images.githubusercontent.com/209129/141304760-bc994315-9c76-4dcc-8f77-a8c6ff7a6fad.png"><br /><img width="476"  src="https://user-images.githubusercontent.com/209129/141304763-8b08d0d8-93d6-4c26-bde3-224857d45468.png"></details>

#### Proxy string input

`/components/inputs/ProxyString.tsx`

A simple wrapper around a regular [String input field](string-input) that displays the value of another field as a read-only input.

Since we are using certain product fields from Shopify as the source of truth (specifically, product title, slug and preview images) and store these in a separate `store` object, these proxy string inputs are used to better surface deeply nested fields to editors.

<details><summary>Example usage</summary>
<p>

```javascript
{
  title: 'Slug',
  name: 'slugProxy',
  type: 'proxyString',
  options: { field: 'store.slug.current' }
}
```

</p>
</details>

<details><summary>Preview</summary>
<img width="600"  src="https://user-images.githubusercontent.com/209129/141304625-7a5c67ca-c7f4-4644-b2b0-8d6faaadba89.png">
</details>

#### Product status (preview component)

`/components/media/ProductStatus.tsx`

A custom preview component that will display product and product variant images defined in `store.previewImageUrl`.

By default, Sanity Connect will populate these fields with the default product (or product variant) image from Shopify. These images are not re-uploaded into your dataset and instead reference Shopify's CDN directly.

This preview component also has visual states for when a product is _unavailable_ in Shopify (e.g. if it has a non-active status), or if it's been removed from Shopify altogether.

Sanity Connect will never delete your product and product variant documents.

<details><summary>Preview</summary>
<img width="320" src="https://user-images.githubusercontent.com/209129/141305895-8e26700a-b48e-4809-bee7-7a52d808db6e.png"></details>

### Bundled dashboard widgets

<p><img width="800" alt="Shopify dashboard widgets" src="https://user-images.githubusercontent.com/209129/141157755-37f4c8aa-9b1a-489e-9264-a6cacfb9a0dd.png"></p>

This studio comes preinstalled with two Shopify dashboard widgets: `shopify-connect` and `shopify-intro`, provided by the [`sanity-plugin-dashboard-widget-shopify`](https://github.com/sanity-io/sanity-plugin-dashboard-widget-shopify) plugin.

These can be configured and removed as you see fit. Please consult the plugin repo for more information.

## Assumptions

No two custom storefronts are the same, and we've taken a few strong opinions with how we've approached this studio.

- Synced Shopify data for `product` and `productVariant` documents are stored in a read-only object, `store`
- Shopify is the source of truth for product titles, slugs (handles) and thumbnail images
- Sanity is used as an additional presentational layer to add custom metadata to products
  - This includes a portable text field, a product-level gallery and re-organisable text sections
- Product inventory levels are not stored in Sanity
  - However, we do store product status (whether a product is a draft, active or archived) and surface this in studio previews
- Some images (such as product and cart line item thumbnails) are served by Shopify's CDN whilst other images (such as product-level image galleries) are handled by Sanity's Image API
  - Similarly to product state, this is surfaced in in preview components throughout the studi
- We only concern ourselves with incoming data from Shopify _products_ and _product variants_
  - Other Shopify document types – such as _collections_, _pages_ and _blog posts_ are skipped and are managed independently in Sanity

We believe these rules work well for simpler use cases, and keeping product titles, images and slugs handled by Shopify helps keep content consistent as you navigate from your product views, to the cart and ultimately checkout.

It's possible that you have differing opinions on how content best be modelled to fit your particular needs – this is normal and encouraged! Fortunately, Sanity was built for this flexibility in mind, and we've written [a guide on structured content patterns of ecommerce][structured-content-patterns] which may help inform how tackle this challenge.

## Setup

If you're reading this on GitHub, chances are you haven't initialized the studio locally yet. To do so, run one of these shell commands:

```sh
# run a one-off initializing script:
npx @sanity/cli init --template shopify

# or install the Sanity CLI globally on your machine
npm i -g @sanity/cli && sanity init --template shopify
```

## Local Development

### Starting development server

```sh
npm start
```

### Deploying the studio

```sh
npm run deploy
```

### Upgrading Sanity Studio

```sh
npm run upgrade
```

If you have the [Sanity CLI][sanity-cli] installed, you can also run thes with `sanity start|deploy|upgrade`. It comes with additional useful functionality.

## License

This repository is published under the [MIT](license) license.

[custom-input-components]: https://www.sanity.io/docs/custom-input-components
[desk-structure]: https://www.sanity.io/docs/structure-builder
[document-actions]: https://www.sanity.io/docs/custom–document-actions
[document-types]: https://www.sanity.io/docs/
[input-components]: https://www.sanity.io/docs/custom-input-widgets
[http-api-docs]: https://www.sanity.io/docs/http-api
[hydrogen-demo]: https://github.com/sanity-io/hydrogen-sanity-demo
[hydrogen-plugin]: https://www.npmjs.com/package/@shopify/hydrogen-plugin-sanity
[license]: https://github.com/sanity-io/sanity/blob/next/LICENSE
[sanity-cli]: https://www.sanity.io/docs/cli
[sanity-client]: https://www.sanity.io/docs/js-client
[sanity-shopify]: https://apps.shopify.com/sanity-connect
[structured-content-patterns]: https://www.sanity.io/guides/structured-content-patterns-for-e-commerce
[string-input]: https://www.sanity.io/docs/string-type
