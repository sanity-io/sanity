<h1>
  <a href="https://www.sanity.io">
    <img width="40%" alt="Sanity Logo" src="https://www.sanity.io/static/images/logo_red.svg?v=2"/>
  </a>
</h1>

<h4>
  <a href="https://www.sanity.io">Sanity</a> is a real-time content infrastructure. The editor, built in JavaScript and React.js, lives in this repo. It connects to a scalable, hosted backend featuring a Graph Oriented Query Language (GROQ), asset pipelines and fast edge caches.
</h4>

<p>
  <a href="https://slack.sanity.io/"><img src="https://slack.sanity.io/badge.svg"></a>
</p>

## Table of contents

- [Table of contents](#table-of-contents)
- [Getting started](#getting-started-%F0%9F%8F%83%E2%80%8D%E2%99%80%EF%B8%8F)
- [Key Features](#key-features-%F0%9F%97%9D)
- [Plugins and tooling](#plugins-and-tooling-%F0%9F%94%8C)
- [Useful links and resources](#useful-links-and-resources)
- [Code of Conduct](#code-of-conduct)
- [Want to contribute?](#want-to-contribute)
- [License](#license)

[![Content Studio, Backend and Content Interfaces](https://public.sanity.io/modell_@2x.png)](https://www.sanity.io)

## Getting started 🏃‍♀️

If you are running Node the commands below install the Sanity CLI tooling and boostraps a new project for you. Not running Node? Have a look at [this](https://www.sanity.io/help/a5f6caba-53c9-4a9f-96ef-1bd1ae8f5c10).

```
npm install -g @sanity/cli
sanity init
```

Then check out the [schema documentation](https://www.sanity.io/docs/content-studio/the-schema) and customize your data structure. When you're happy, just `sanity deploy` to host the editor with us and head over to [sanity.io](https://www.sanity.io/manage) to invite editors.

As they're merrily content managing you can start setting up a front-end to render your data based on one of the [demos](#sample-frontends) we have available.

Feel totally free to ping us on [Slack](https://slack.sanity.io) or [Gitter](https://gitter.im/sanity-io/sanity) for a chat should you have questions along the way!

## Key Features 🗝

#### [Content Studio](https://www.sanity.io/content-studio) 🖋

- Efficient editing
- Open source, MIT license
- Real-time
- Plug-in architecture
- Block editor for structured content

#### [Hosted Backend](https://www.sanity.io/hosted-backend) ☁️

- Secure, scalable and GDPR compliant
- Zero config Graph Oriented Query Language (GROQ)
- Hard references for integrity
- API & asset CDNs
- Capable image pipeline

## Plugins and tooling 🔌

### Content Studio plugins

#### Input types

- [Google Maps input](https://www.sanity.io/docs/schema-types/geopoint-type) (`sanity install @sanity/google-maps-input`)
- [Color input](https://www.npmjs.com/package/@sanity/color-input) (`sanity install @sanity/color-input`)
- [Code input (syntax highlighted blocks)](https://www.npmjs.com/package/@sanity/code-input) (`sanity install @sanity/code-input`)

#### Tools

- [Vision - GROQ sandbox tool](https://www.npmjs.com/package/@sanity/vision) (`sanity install @sanity/vision`)

### Schema plugins

- [Podcast schema](https://www.npmjs.com/package/sanity-plugin-podcast#get-the-podcast-on-the-ether-headphones) (`sanity install podcast`)

### Migration tools

- [Tools for processing Sanity rich text](https://www.npmjs.com/package/@sanity/block-tools) (`npm i @sanity/block-tools`)
- [Convert Sanity rich text into a generic tree](https://www.npmjs.com/package/@sanity/block-content-to-tree) (`npm i @sanity/block-content-to-tree`)
- [Migrate from Contentful to Sanity](https://github.com/sanity-io/contentful-to-sanity) (`npm install -g contentful-to-sanity`)
- [Migrate from podcast RSS feed to Sanity](https://github.com/sanity-io/podcast-to-sanity) (`npm install -g podcast-to-sanity`)

### API Clients

- [JavaScript](https://www.npmjs.com/package/@sanity/client)
- [PHP](https://packagist.org/packages/sanity/sanity-php)

### Sample frontends

- Next.js: [Movie Studio](https://github.com/sanity-io/example-frontend-next-js) | [Blog](https://github.com/sanity-io/tutorial-sanity-blog-react-next)
- React Native: [Movie Studio](https://github.com/sanity-io/example-app-react-native)
- Vue.js: [Movie Studio](https://github.com/sanity-io/example-frontend-vue-js) | [Ecommerce](https://github.com/sanity-io/example-ecommerce-snipcart-vue)
- Silex + Twig: [Movie Studio](https://github.com/sanity-io/example-frontend-silex-twig)

### Frontend rendering

- [Block content to HTML](https://www.npmjs.com/package/@sanity/block-content-to-html) (`npm i @sanity/block-content-to-html`)
- [Block content to Hyperscript](https://www.npmjs.com/package/@sanity/block-content-to-hyperscript) (`npm i @sanity/block-content-to-hyperscript`)
- [Block content to Markdown](https://github.com/sanity-io/block-content-to-markdown) (`npm i @sanity/block-content-to-markdown`)
- [Block content to React](https://www.npmjs.com/package/@sanity/block-content-to-react) (`npm i @sanity/block-content-to-react`)
- [Quickly generate image urls from Sanity image records](https://www.npmjs.com/package/@sanity/image-url) (`npm i @sanity/image-url`)

### Community contributed plugins

We are grateful for all who dedicate their time making stuff for the Sanity.io community ❤️. These are to the best of our knowledge ready for use. If you encounter any problems with these packages, please file an issue in their respective GitHub repositories, and remember to be nice and constructive.

- [C# /.NET client](https://github.com/onybo/sanity-client) (Thanks [@onybo](https://github.com/onybo)!)
- [Laravel (PHP) client](https://github.com/eastslopestudio/laravel-sanity) (Thanks [@eastslopestudio](https://github.com/eastslopestudio)!)
- [Sanity as a Gatsby source](https://github.com/hcavalieri/gatsby-source-sanity) (Thanks [@hcavalieri!](https://github.com/hcavalieri))
- [Block content to Vue](https://github.com/rdunk/sanity-blocks-vue-component) (Thanks [@rdunk](https://github.com/rdunk)!)
- [Sanity Query Helper](https://github.com/staccx/sanity-query-helper) (Thanks [@staccx](https://github.com/staccx/)!)

## Useful links and resources

### Stay up to date 🗞

- Follow **@sanity_io** on [twitter](https://twitter.com/sanity_io) or [mastodon](https://mastodon.social/@sanity_io)
- Subscribe to our [newsletter](http://eepurl.com/b2yaDz)

### Documentation 📚

The [documentation](https://www.sanity.io/docs/introduction/getting-started) covers [how to work with content in Sanity](https://www.sanity.io/docs/introduction/the-sanity-way), [schema types](https://www.sanity.io/docs/reference/schema-types), [extending the content studio](https://www.sanity.io/docs/content-studio/extending), how to [query the API](https://www.sanity.io/docs/data-store/how-queries-work), [importing data](https://www.sanity.io/docs/data-store/importing-data) and [useful tips for presenting your content in a frontend](https://www.sanity.io/docs/front-ends).

### Blogs, tutorials and other reads

- [The Sanity.io blog](https://sanity.io/blog)
- [Tutorial: A Sanity backed blog with React and Next.js](https://www.sanity.io/blog/build-your-own-blog-with-sanity-and-next-js)
- [Headless in Love with Sanity](https://hackernoon.com/headless-in-love-with-sanity-689960571dc)
- [Sanity with serverless Webtask and Google's Dialogflow ](https://hackernoon.com/put-your-chatbot-where-your-headless-cms-is-15cf174774c6)
- [
  Design with real content: How to connect Sanity with Sketch using Craft’s InVision plugin](https://www.sanity.io/blog/design-with-real-content-how-to-connect-sanity-with-sketch-using-craft-s-invision-plugin)
- [Five interesting ways to use Sanity.io for image art direction](https://css-tricks.com/five-interesting-ways-to-use-sanity-io-for-image-art-direction/)
- [Build an Angular E-Commerce App on Top of Sanity's Headless CMS
  ](https://snipcart.com/blog/headless-angular-ecommerce-app)

![Content spread throughout the urban scape](https://public.sanity.io/modell_followup_1_@2x.png)

## Code of Conduct

We aim to be an inclusive, welcoming community for everyone. To make that explicit, we have a [code of conduct](https://github.com/sanity-io/sanity/blob/master/CODE_OF_CONDUCT.md) that applies to communication around the project.

## Want to contribute?

Found a bug, or want to contribute code? Pull requests and issues are most welcome. You might want to take a look at our [Contributing guidelines](https://github.com/sanity-io/sanity/blob/master/CONTRIBUTING.md) also.

## License

The Sanity Content Studio is available under the [_MIT License_](https://github.com/sanity-io/sanity/blob/master/LICENSE)

![](https://cdn.sanity.io/images/3do82whm/production/iFi4bnMdiVHd37lfdaRV6lZQ-1600x800.png?w=1000&h=350&fit=max)
