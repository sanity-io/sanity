# Sanity Studio for Shopify Projects

<p><img src="https://user-images.githubusercontent.com/209129/173606241-ae6694f7-57f0-4ed7-9d05-60c563c4233b.png" width="800" /></p>

## About

This Sanity Studio is configured for headless Shopify projects that use the official [Sanity Connect app][sanity-shopify], allowing you to extend Shopify products and collections with your own rich editorial content.

It contains examples of customizing your [desk structure][docs-desk-structure], [document actions][docs-document-actions] and [input components][docs-input-components].

This studio can be used with our [Hydrogen starter][hydrogen-demo], your frontend, or anywhere else you want your e-commerce content to go.

## Features

This studio comes preconfigured with Shopify-friendly content schemas and a whole host of customizations to make managing Shopify data in your Sanity studio easier.

It also comes with several convenient layout modules which can be re-used across various pages.

**[View studio features][studio-features]**

## Assumptions

No two custom storefronts are the same, and we've taken a few strong opinions on how we've approached this studio.

- Synced Shopify data for `collection`, `product` and `productVariant` documents are stored in a read-only object, `store`
- Shopify is the source of truth for both product titles, slugs (handles) and thumbnail images
- Shopify is the source of truth for collections
- Sanity is used as an additional presentational layer to add custom metadata to both Shopify collections and products
  - For products: this includes a portable text field with support for editorial modules
  - For collections: this includes a customizable array of editorial modules
- Some images (such as product and cart line item thumbnails) are served by Shopify's CDN whilst other images (such as those served in editorial modules) are handled by Sanity's Image API
- We only concern ourselves with incoming data from Shopify _collections_, _products_ and _product variants_

We believe these rules work well for simpler use cases, and keeping product titles, images and slugs handled by Shopify helps keep content consistent as you navigate from your product views to the cart and ultimately checkout. Managing collections in Shopify gives you the flexibility to take full advantage of manual and automated collections.

You may have differing opinions on how content best be modeled to fit your particular needs – this is normal and encouraged! Fortunately, Sanity was built with this flexibility in mind, and we've written [a guide on structured content patterns of e-commerce][structured-content-patterns] which may help inform how to tackle this challenge.

## Setup

If you're reading this on GitHub, chances are you haven't initialized the studio locally yet. To do so, run the following shell command:

```sh
# run a one-off initializing script:
npx @sanity/cli init --template shopify
```

Make sure to run the tagged release! (`@sanity/cli`)

## Local Development

### Starting development server

```sh
npm run dev
```

### Deploying the studio

```sh
npm run deploy
```

### Upgrading Sanity Studio

```sh
npm run upgrade
```

If you have the [Sanity CLI][docs-cli] installed, you can also run this with `sanity start|deploy|upgrade`. It comes with additional useful functionality.

## License

This repository is published under the [MIT](license) license.

[docs-cli]: https://www.sanity.io/docs/cli
[docs-custom-input-components]: https://www.sanity.io/docs/custom-input-components
[docs-desk-structure]: https://www.sanity.io/docs/structure-builder
[docs-document-actions]: https://www.sanity.io/docs/document-actions
[docs-input-components]: https://www.sanity.io/docs/custom-input-widgets
[docs-string-input]: https://www.sanity.io/docs/string-type
[hydrogen-demo]: https://github.com/sanity-io/hydrogen-sanity-demo
[license]: https://github.com/sanity-io/sanity/blob/next/LICENSE
[sanity-shopify]: https://apps.shopify.com/sanity-connect
[structured-content-patterns]: https://www.sanity.io/guides/structured-content-patterns-for-e-commerce
[studio-features]: docs/features.md
