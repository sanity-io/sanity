# GROQ tagged template literal

This module exports a single function that can be called with an ES2015 [template string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) to signal that it represents a GROQ-query.

The result will be the exact same string as the input, - this is currently helpful for getting syntax highlighting in editors, but in the future it might also parse and validate queries, strip unncessary whitespace and similar.

Pairs well with [vscode-sanity](https://github.com/sanity-io/vscode-sanity)!

## Installing

```
npm install --save groq
```

## Usage

```js
import groq from 'groq'

const query = groq`*[_type == 'products'][0...10]`
```

## Automatic type inference

If you are using `@sanity/codegen` you can use `defineQuery` instead of `groq` to
get type inference out of the box:

```ts
import {defineQuery} from 'groq'

const query = defineQuery(`*[_type == 'products'][0...10]`)
```

In the future we might merge `defineQuery` with `groq`, but this is currently [not
100% supported by TypeScript](https://github.com/microsoft/TypeScript/issues/33304).

## What is Sanity? What is GROQ?

[Sanity](https://www.sanity.io) is a real-time content infrastructure with a scalable, hosted backend featuring a Graph Oriented Query Language (GROQ), asset pipelines and fast edge caches.

To get started with Sanity, please head over to our [getting started guide](https://sanity.io/docs/introduction/getting-started)

## License

MIT-licensed. See LICENSE.
