# Sanity Studio for Shopify Storefronts

## About

This Sanity Studio is configured for Shopify storefronts that use the official [Sanity Connect app](https://apps.shopify.com/sanity-connect) to sync content from Sanity to Shopify.

It contains examples of customizing your [desk structure](https://www.sanity.io/docs/structure-builder), [document actions](https://www.sanity.io/docs/document-actions) and [input components](https://www.sanity.io/docs/custom-input-widgets).

If you're building a headless storefront, you may want to check out our [starter Studio for headless storefronts](https://github.com/sanity-io/sanity-shopify-studio), which has a richer content model.

## Features

This studio comes preconfigured with Shopify-friendly content schemas and a whole host of customizations to make managing Shopify data in your Sanity studio easier. It also comes bundled with our [Shopify asset plugin](https://github.com/sanity-io/sanity-plugin-shopify-assets), which enables you to choose assets from your Shopify store in your Sanity Studio.

Once you have sync'd content to your Shopify store, you can follow our documentation on how to [display content in Liquid](https://www.sanity.io/docs/displaying-sanity-content-in-liquid).

## Setup

If you're reading this on GitHub, chances are you haven't initialized the studio locally yet. To do so, run the following shell command:

```sh
# run a one-off initializing script:
npx @sanity/cli init --template shopify-online-storefront
```

Make sure to run the tagged release! (`@sanity/cli`)

You'll need install [Sanity Connect](https://apps.shopify.com/sanity-connect) to your Shopify store, and [enable the sync to your Shopify store](https://www.sanity.io/docs/sanity-connect-for-shopify#1bcb10c66c21). to update `SHOPIFY_STORE_ID` in `constants.ts` to reflect your Shopify domain.

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

If you have the [Sanity CLI](https://www.sanity.io/docs/cli) installed, you can also run this with `sanity start|deploy|upgrade`. It comes with additional useful functionality.

## License

This repository is published under the [MIT](license) license.
