<h1 align="center">
  <a href="https://www.sanity.io">
    <img width="40%" alt="Sanity Logo" src="https://www.sanity.io/static/images/logo_red.svg?v=2"/>
  </a>
</h1>

<h4 align="center">
  <a href="https://www.sanity.io">Sanity</a> is a real-time content infrastructure. The editor, built in JavaScript and React.js, lives in this repo. It connects to a scalable, hosted backend featuring a Graph Oriented Query Language (GROQ), asset pipelines and fast edge caches.
</h4>

<p align="center">
  <a href="https://gitter.im/sanity-io/sanity"><img src="https://badges.gitter.im/sanity-io/sanity.svg"></a>
</p>

## Table of contents

*  <a href="#getting-started">Getting Started</a>
*  <a href="#key-features">Key Features</a>
*  <a href="#useful-links-and-resources">Links and resources</a>
*  <a href="#want-to-contribute">Contribute</a>
*  <a href="#license">License</a>


[![Content Studio, Backend and Content Interfaces](https://public.sanity.io/modell_@2x.png)](https://www.sanity.io)

## Getting started

Install takes two minutes. Just run:

```
npm install -g @sanity/cli
sanity init
```

Then check out the [schema documentation](https://www.sanity.io/docs/content-studio/the-schema) and customize your data structure. When you're happy, just `sanity deploy` to host the editor with us and head over to [sanity.io](https://www.sanity.io/manage) to invite editors. 

As they're merrily content managing you can start setting up a front-end to render your data based on one of the [demos](#sample-frontends) we have available.

Feel totally free to [ping us on Gitter](https://gitter.im/sanity-io/sanity) for a chat should you have questions along the way!

## Key Features

#### [Content Studio](https://www.sanity.io/content-studio)

* Efficient editing
* Open source, MIT license
* Real-time
* Plug-in architecture
* Block editor for structured content

#### [Hosted Backend](https://www.sanity.io/hosted-backend)

* Secure, scalable and compliant
* Zero config Graph Oriented Query Language (GROQ)
* Hard references for integrity
* API & asset CDNs
* Capable image pipeline

## Useful links and resources

![Roll of paper](https://public.sanity.io/modell_followup_2_@2x.png)

### Documentation
The [documentation](https://www.sanity.io/docs/introduction/getting-started) covers [how to work with content in Sanity](https://www.sanity.io/docs/introduction/the-sanity-way), [schema types(https://www.sanity.io/docs/reference/schema-types), [extending the content studio](https://www.sanity.io/docs/content-studio/extending), how to [query the API](https://www.sanity.io/docs/data-store/how-queries-work), [importing data](https://www.sanity.io/docs/data-store/importing-data) and [useful tips for presenting your content in a frontend](https://www.sanity.io/docs/front-ends).



### Content Studio plugins

#### Input types
* [Google Maps input](https://www.sanity.io/docs/schema-types/geopoint-type) (`sanity install @sanity/google-maps-input`)
* [Color input](https://www.npmjs.com/package/@sanity/color-input) (`sanity install @sanity/color-input`)
* [Code input (syntax highlighted blocks)](https://www.npmjs.com/package/@sanity/code-input) (`sanity install @sanity/code-input`)
* [Rich Date input](https://www.npmjs.com/package/@sanity/rich-date-input) (`sanity install @sanity/rich-date-input`)

#### Tools
* [Vision - GROQ sandbox tool](https://www.npmjs.com/package/@sanity/vision) (`sanity install @sanity/vision`)

### Schema plugins

* [Podcast schema](https://www.npmjs.com/package/sanity-plugin-podcast#get-the-podcast-on-the-ether-headphones) (`sanity install podcast`)

### Migration tools

* [Tools for processing Sanity block content](https://www.npmjs.com/package/@sanity/block-tools) (`npm i @sanity/block-tools`)
* [Convert Sanity block content into a genereic tree](https://www.npmjs.com/package/@sanity/block-content-to-tree) (`npm i @sanity/block-content-to-tree`)
* [Migrate from Contentful to Sanity](https://github.com/sanity-io/contentful-to-sanity) (`npm install -g contentful-to-sanity`)

### API Clients

* [JavaScript](https://www.npmjs.com/package/@sanity/client)
* [PHP](https://packagist.org/packages/sanity/sanity-php)

#### Community contributed

* [C# /.NET](https://github.com/onybo/sanity-client) (Thanks [@onybo](https://github.com/onybo)!)
* [Laravel (PHP)](https://github.com/eastslopestudio/laravel-sanity) (Thanks [@eastslopestudio](https://github.com/eastslopestudio)!)

### Sample frontends

* [Next.js](https://github.com/sanity-io/example-frontend-next-js)
* [React Native](https://github.com/sanity-io/example-app-react-native)
* [Vue.js](https://github.com/sanity-io/example-frontend-vue-js)
* [Silex + Twig](https://github.com/sanity-io/example-frontend-silex-twig)

### Frontend rendering

* [Block content to HTML](https://www.npmjs.com/package/@sanity/block-content-to-html) (`npm i @sanity/block-content-to-html`)
* [Block content to React](https://www.npmjs.com/package/@sanity/block-content-to-react) (`npm i @sanity/block-content-to-react`)
* [Block content to Hyperscript](https://www.npmjs.com/package/@sanity/block-content-to-hyperscript) (`npm i @sanity/block-content-to-hyperscript`)
* [Quickly generate image urls from Sanity image records](https://www.npmjs.com/package/@sanity/image-url) (`sanity install @sanity/image-url`)

### Blogs, tutorials and other reads

* [Headless in Love with Sanity](https://hackernoon.com/headless-in-love-with-sanity-689960571dc)
* [Sanity with serverless Webtask and Google's Dialogflow ](https://hackernoon.com/put-your-chatbot-where-your-headless-cms-is-15cf174774c6)
* [Build an Angular E-Commerce App on Top of Sanity's Headless CMS
](https://snipcart.com/blog/headless-angular-ecommerce-app)
* [Make your own podcasting platform](https://hackernoon.com/make-your-own-podcasting-platform-ab833cf16e1c)

### Stay up to date

* Follow [@sanity_io](https://twitter.com/sanity_io) on Twitter
* Subscribe to our [newsletter](http://eepurl.com/b2yaDz)

## Want to contribute?

Found a bug, or want to contribute code? Pull requests and issues are most welcome. You might want to take a look at our [Contributing guidelines](https://github.com/sanity-io/sanity/blob/master/CONTRIBUTING.md) also.

## License

The Sanity Content Studio is available under the *MIT License*

![](https://cdn.sanity.io/images/3do82whm/production/iFi4bnMdiVHd37lfdaRV6lZQ-1600x800.png?w=1000&h=350&fit=max)
