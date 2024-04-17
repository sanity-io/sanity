# @sanity/mutate

Toolkit for working with [Sanity](https://sanity.io) mutations in JavaScript & TypeScript

Disclaimer: This is work in progress, use at own risk!

## At a glance

- Declarative & composable mutation creators
- Utilities for applying mutations on in-memory documents (experimental)
- Local in-memory dataset replica with support for optimistic updates (experimental)

## Features

- Mutations can be declared using creator functions and passed around like any other values, transformed and composed
  into larger operations spanning multiple documents
- Mutations are mere descriptions of operations and can be serialized to a compact json format or a Sanity mutation API
  request payload
- Nodes can be addressed using paths as JavaScript values instead of string paths
- Closely aligned with the [Sanity.io mutation format](https://www.sanity.io/docs/http-mutations)
- Supports automatically adding `_key`'s to objects in arrays, so you don't have to.
- Experimental support for applying mutations on in-memory documents
- Great TypeScript support

## Usage Example

```ts
import {
  at,
  create,
  createIfNotExists,
  patch,
  SanityEncoder,
  set,
  setIfMissing,
} from '@sanity/mutate'

const mutations = [
  create({_type: 'dog', name: 'Fido'}),
  createIfNotExists({_id: 'document-1', _type: 'someType'}),
  createIfNotExists({_id: 'other-document', _type: 'author'}),
  patch('other-document', [
    at('published', set(true)),
    at('address', setIfMissing({_type: 'address'})),
    at('address.city', set('Oslo')),
  ]),
]

// get a projectId and dataset at sanity.io
const projectId = '<projectId>'
const dataset = '<dataset>'

// Submit mutations to the Sanity API
fetch(`https://${projectId}.api.sanity.io/v2023-08-01/data/mutate/${dataset}`, {
  method: 'POST',
  mode: 'cors',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(SanityEncoder.encode(mutations)),
})
  .then(response => response.json())
  .then(result => console.log(result))
```

## Mutation creators

### Mutations

- `create(document: SanityDocument)`: Create a new document
- `createIfNotExists(document: SanityDocument)`: Create a new document if it does not exist
- `createOrReplace(document: SanityDocument)`: Create a new document or replace an existing one
- `delete(documentId: SanityDocument)`: Delete a document (aliases: `del`, `destroy`)
- `patch(documentId: string, patches: NodePatch | NodePatch[], options?: {ifRevisionId?: string})`: Patch a document. Can
  optionally provide a `ifRevisionId` for [optimistic locking](https://www.sanity.io/docs/http-mutations#26600a871378). If
  the current document revision doesn't match the given revision the patch mutation will fail when applied.

### Patches

A patch is a combination of a node path and an operation. The node path is a
simplified [JSONMatch](https://www.sanity.io/docs/json-match) path or an array of path segments that points to a
specific node in the document. The operation is one of the operations described [below](https://github.com/bjoerge/mutiny#patch-operations).

- `at(path: Path | string, operation: Operation)`: Create a patch from a path and an operation

#### Examples:

```js
at('foo.bar', set('baz'))

// equivalent to the above
at(['foo', 'bar'], set('baz'))

at(['array[0]'], insert('baz'))

// Set a value deep into an array of objects addressed by `_key`
at(['people', {_key: 'xyz'}, 'name'], set('Bjørge'))

// equivalent to the above, using a serialized path:
at('people[_key=="xyz"].name', set('Bjørge'))
```

### Patch Operations

#### Patch operations applicable for all data types

- `set<T>(value: T)`: Set the value of the node to the given `value`
- `setIfMissing<T>(value: T)`: Set the value of the node to the given `value` if the node has no value
- `unset()`: Remove the node from the document

#### Object operations

- `assign(value: object)`: Do a shallow merge of the node with the given value. If the node is an object, the value will
  be merged into the object similar to `Object.assign(<currentValue>, value)`.
- `unassign(attributes: string[])`: Remove the given attributes from the existing value.

#### Array operations

- `prepend<T>(items: T[])`: Prepend the given items to the beginning of the array
- `append<T>(items: T[])`: Append the given items to the end of the array
- `insert<T>(items: T | T[], position: "before" | "after", referenceItem: number | {_key: string})`: Insert the given
  items before or after the given `before` or `after` item. If `before` or `after` is not provided, the items will be
  inserted at the beginning or end of the array.
- `truncate(startIndex: number, endIndex?: number)`: Remove items from the array starting at `startIndex` and ending
  at `endIndex`. If `endIndex` is not provided, all items after `startIndex` will be removed.
- `replace<T>(items: T | T[], referenceItem: number | {_key: string})`: Replaces the `referenceItem` (addressed by
  index or \_key) with the given `item` or `items`. If `items` is an array, `referenceItem` will be replaced by the
  items and any existing elements that comes after `referenceItem` will be shifted to the right.
- `upsert<T>(items: T | T[], position: "before" | "after", referenceItem: number | {_key: string})`: Upsert one or more items
  into the array. If the items match existing items in the array, the existing items will be replaced with the given
  items. If the items do not match any existing items, it will be inserted into the array. The`referenceItem` specifies a reference item to place missing items relative to. If. If not provided, any missing items will be inserted at
  the beginning or end of the array, depending on `position`. The `position`option can be used to specify where to insert the item if it does not
  match any existing items. If not provided, the item will be inserted at the end of the array.

#### Number operations

- `inc(value: number)`: Increment the number by the given value
- `dec(value: number)`: Decrement the number by the given value

#### String operations

- `diffMatchPatch(patch: string)`: Apply an incremental text patch to the current string. Read more
  about [diffMatchPatch](https://www.sanity.io/docs/http-patches#aTbJhlAJ).

## Advanced examples

Define a set of operations and turn it into a patch mutation that can be applied on a set of documents

```js
const patches = [
  at('metadata', setIfMissing({})), // make sure metadata object exists
  at('metadata.published', set(true)),
  at('metadata.publishedAt', set(new Date().toISOString())),
]
const mutations = ['document-1', 'document-2', 'document-3'].map(id =>
  patch(id, patches),
)

// commit mutations to datastore
commitMutations(mutations)
```

## Apply mutations on local documents (experimental)

Mutations can be applied to an in-memory collection of documents

```ts
import {applyInCollection} from '@sanity/mutate/_unstable_apply'
import {createIfNotExists, del} from '@sanity/mutate'

const initial = [{_id: 'deleteme', _type: 'foo'}]

const updated = applyInCollection(initial, [
  createIfNotExists({_id: 'mydocument', _type: 'foo'}),
  createIfNotExists({_id: 'anotherDocument', _type: 'foo'}),
  del('deleteme'),
])

console.log(updated)
/*=>
[
  { _id: 'mydocument', _type: 'foo' },
  { _id: 'anotherDocument', _type: 'foo' }
]
*/
```

Note: when applying mutations on a collection, referential integrity is preserved. This means that if a mutation is effectively a noop (e.g. nothing actually changed), the same object reference will be returned.

```ts
import {applyInCollection} from '@sanity/mutate/_unstable_apply'
import {at, createIfNotExists, patch, set} from '@sanity/mutate'

const initial = [
  {
    _id: 'someDoc',
    _type: 'foo',
    value: 'ok',
    nested: {value: 'something'},
    otherNested: {message: 'something else'},
  },
]

const updated = applyInCollection(initial, [
  createIfNotExists({_id: 'someDoc', _type: 'foo'}),
  patch('someDoc', [at('value', set('ok'))]),
  patch('someDoc', [at('nested.value', set('something'))]),
])

// the mutation didn't cause anything to change
console.log(initial === updated)
//=> true
```

This is also the case for _nodes_ unaffected by the mutations:

```ts
import {applyInCollection} from '@sanity/mutate/_unstable_apply'
import {at, createIfNotExists, patch, set} from '@sanity/mutate'

const initial = [
  {
    _id: 'someDoc',
    _type: 'foo',
    value: 'ok',
    nested: {value: 'something'},
    otherNested: {message: 'something else'},
  },
]

const updated = applyInCollection(initial, [
  createIfNotExists({_id: 'someDoc', _type: 'foo'}),
  patch('someDoc', [at('value', set('ok'))]),
  patch('someDoc', [at('nested.value', set('something'))]),
  patch('someDoc', [at('otherNested.message', set('hello'))]),
])

// the `nested` object unaffected by the mutation
console.log(initial[0].nested === updated[0].nested)
//=> true
```

## Apply a patch mutation to a single document

Alternatively, a patch mutation can be applied to a single document as long as its id matches the document id of the mutation:

```ts
import {applyPatchMutation} from '@sanity/mutate/_unstable_apply'
import {at, insert, patch, setIfMissing} from '@sanity/mutate'

const document = {_id: 'test', _type: 'foo'}

const updated = applyPatchMutation(
  document,
  patch('test', [
    at('title', setIfMissing('Foo')),
    at('cities', setIfMissing([])),
    at('cities', insert(['Oslo', 'San Francisco'], 'after', 0)),
  ]),
)

console.log(updated)
/*=>
{
  _id: 'test',
  _type: 'foo',
  title: 'Foo',
  cities: [ 'Oslo', 'San Francisco' ]
}
*/
```

### Differences from Sanity API

To better align with a strict type system, mutiny differs slightly from the Sanity API when applying patches. Although all the mutation types you can express with mutiny can also be expressed as Sanity API mutations, the inverse is not necessarily true; The Sanity API (e.g. a listener) may produce patches that can't be represented in mutiny without an extra conversion step that takes the current document into account. In addition, applying a patch in mutiny behaves differently from applying the same patch using the Sanity API on a few accounts:

- `set` and`setIfMissing` does not create intermediate empty objects - Using the Sanity API, `set` and `setIfMissing` will create intermediate empty objects if any object along the given path doesn't already exist. In `mutiny`, these patches will only apply to already existing objects.
- Limited json match support. Sanity mutations supports a powerful path selection syntax for targeting multiple document nodes at once with [json-match](https://www.sanity.io/docs/json-match). To keep things simple, a mutiny patch can only target a single document node.
