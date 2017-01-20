# sanity

Sanity is CMS construction kit. This repository contains many of the core Sanity frontend modules, and uses [Lerna](https://lernajs.io/) to manage cross-dependencies, publishing and to simplify the workflow.

** Note: ** Unless you want to modify/contribute to the core Sanity components, you're probably better off checking out the [Sanity documentation](http://sanity.io/docs/) which explains how to get started with setting up a new Sanity project.

## Installing

```
git clone git@github.com:sanity-io/sanity.git
cd sanity
npm install
npm run bootstrap
npm start
```

## Publishing

```
npm run publish
```

## Issues?

If you run into build issues, you might want to run `npm run clean`, which will delete all `node_modules` folders, then run a fresh `npm run bootstrap` to install and cross-symlink all modules.

## Testing

```
npm test
```

Note: this runs `npm test` for all the Sanity packages - the output can be quite hard to read. If you encounter an issue, it's usually best to figure out which module is failing, then run `npm test` in that individual module.

