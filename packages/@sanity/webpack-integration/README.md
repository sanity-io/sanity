# @sanity/webpack-integration

Tools and modules required for making partisan (the part system) work with webpack. Note: currently only works with Webpack 1.

## Installing

```
npm install --save @sanity/webpack-integration
```

## Usage

```js
const sanityWebpack = require('@sanity/webpack-integration/v1')
const options = {
  basePath: '/path/to/project',
  env: 'production'
}

// Get array of plugins required for part loading
sanityWebpack.getPlugins(options)

// Get array of loader definitions required for part loading
sanityWebpack.getLoaders(options)

// Get array of postcss plugins required to build the CSS used in Sanity
sanityWebpack.getPostcssPlugins(options)

// Get a partial webpack configuration for the Sanity-specific parts. You'll have to merge this with your existing webpack config.
sanityWebpack.getConfig(options)



// Less common, but if you need more fine-grained access to internals:

// Get a preconfigured `DefinePlugin` that exposes `__DEV__`
sanityWebpack.getEnvPlugin(options)

// Get the part resolver plugin required for part imports
sanityWebpack.getPartResolverPlugin(options)

// Get the part loader (requires the PartResolverPlugin)
sanityWebpack.getPartLoader(options)

// Get the resolving function required for postcss-import
sanityWebpack.getStyleResolver(options)

// Get an initialized postcss-import plugin
sanityWebpack.getPostcssImportPlugin(options)
```

## License

MIT-licensed. See LICENSE.
