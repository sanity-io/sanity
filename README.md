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


[![Screenshot](https://cdn.sanity.io/images/3do82whm/production/cllejaievr_1QvGplh3diVAteYXT8aRNtLV-2376x1260.png?fm=jpg)](https://www.sanity.io)

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

* [Documentation](https://www.sanity.io/docs/introduction/getting-started)

### Content Studio plugins

* [Vision](https://github.com/sanity-io/sanity/blob/next/packages/%40sanity/vision/README.md) (`sanity install @sanity/vision`)
* [Google Maps input](https://github.com/sanity-io/sanity/blob/next/packages/%40sanity/google-maps-input) (`sanity install @sanity/google-maps-input`)
* Color Picker (`sanity install @sanity/color-picker`)
* Syntax highlighted editor blocks (`sanity install @sanity/code`)

### Schema plugins

* [Podcast schema](https://www.npmjs.com/package/sanity-plugin-podcast#get-the-podcast-on-the-ether-headphones) (`sanity install podcast`)

### Migration tools

* [contentful-to-sanity](https://github.com/sanity-io/contentful-to-sanity)

### API Clients

* [JavaScript](https://www.npmjs.com/package/@sanity/client)
* [PHP](https://packagist.org/packages/sanity/sanity-php)

#### Community contributed

* [C# /.NET](https://github.com/onybo/sanity-client)

### Sample frontends

* [Next.js](https://github.com/sanity-io/example-frontend-next-js)
* [React Native](https://github.com/sanity-io/example-app-react-native)
* [Vue.js](https://github.com/sanity-io/example-frontend-vue-js)
* [Silex + Twig](https://github.com/sanity-io/example-frontend-silex-twig)

### Block content rendering

* [Block content to HTML](https://github.com/sanity-io/block-content-to-html)
* [Block content to React](https://www.npmjs.com/package/@sanity/block-content-to-react)
* [Block content to Hyperscript](https://www.npmjs.com/package/@sanity/block-content-to-hyperscript)

### Blogs, tutorials and other reads

* [Headless in Love with Sanity](https://hackernoon.com/headless-in-love-with-sanity-689960571dc)
* [Put your chatbot where your headless CMS is](https://hackernoon.com/put-your-chatbot-where-your-headless-cms-is-15cf174774c6) – Sanity with serverless Webtask and Google's Dialogflow 

### Stay up to date

* Follow [@sanity_io](https://twitter.com/sanity_io) on Twitter
* Subscribe to our [newsletter](http://eepurl.com/b2yaDz)

## Want to contribute?

Found a bug, or want to contribute code? Pull requests and issues are most welcome. You might want to take a look at our [Contributing guidelines](https://github.com/sanity-io/sanity/blob/master/CONTRIBUTING.md) also.

## License

The Sanity Content Studio is available under the *MIT License*


