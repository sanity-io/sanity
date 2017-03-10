# Sanity

[![Join the chat at https://gitter.im/sanity-io/sanity](https://badges.gitter.im/sanity-io/sanity.svg)](https://gitter.im/sanity-io/sanity?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Sanity is a CMS a construction kit with a rich data model and real-time collaboration.

This repository contains the core Sanity front-end modules. It uses [Lerna](https://lernajs.io/) to manage cross-dependencies, publishing and to simplify workflows.

** Note: ** Sanity is pre-release software with daily releases. APIs are still in flux.

Unless you want to modify/contribute to the core Sanity components, you're probably better off having a look at the [Sanity documentation](http://sanity.io/docs/) that explains how to quickly get started using our hosted backend.

## Installing

```
git clone git@github.com:sanity-io/sanity.git
cd sanity
npm install
npm run init
npm start
```

## Publishing

```
npm run publish
```

## Issues?

If you run into build issues, you might want to run `npm run init`, which will delete all `node_modules` folders, then run a fresh `npm run bootstrap` to install and cross-symlink all modules, followed by building all ES6 code to ES5.

## Testing

```
npm test
```

Note: this runs `npm test` for all the Sanity packages - the output can be quite hard to read. If you encounter an issue, it's usually best to figure out which module is failing, then run `npm test` in that individual module.

