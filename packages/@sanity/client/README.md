[![Build Status](http://img.shields.io/travis/sanity-io/client/master.svg?style=flat-square)](https://travis-ci.org/sanity-io/client)

# Sanity client

Javascript client for Sanity. Works in browsers (IE8+) and node.js.

## Requirements
Sanity Client requires the JavaScript runtime to have a global ES6-compliant `Promise` available. If your runtime environment doesn't provide a spec compliant `Promise` implementation, we recommend using [native-promise-only](https://www.npmjs.com/package/native-promise-only), [es6-promise](https://www.npmjs.com/package/es6-promise) or another [spec-compliant](https://promisesaplus.com/implementations) implementation.

## Installation

The client can be installed from npm:

```
npm install --save @sanity/client
```

# API

```js
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop',
  token: 'sanity-auth-token' // or leave blank to be anonymous user
})
```

`const client = sanityClient(options)`

Initializes a new Sanity Client. Required options are `projectId`, `dataset` and `token`.


## Performing queries

```js
const query = 'bikeshop.bikes[.seats > 1] {.name, .seats}'
client.data.fetch(query).then(bikes => {
  console.log('Bikes with more than one seat:')
  bikes.forEach(bike => {
    console.log(`${bike.name} (${bike.seats} seats)`)
  })
})
```

`client.data.fetch(query)`

Perform a query using. Query string must be valid GQL syntax.


## Creating documents

```js
const doc = {name: 'Bengler Tandem Extraordinaire', seats: 2}
client.data.create(doc).then(res => {
  console.log(`Bike was created, document ID is ${res.documentId}`)
})
```

`client.data.create(doc)`

Create a document. Parameter is a plain JS object representing the document.


## Patch/update a document

```js
client.data
  .patch('bikeshop/bike-123') // Document ID to patch
  .set({inStock: false}) // Shallow merge
  .inc({numSold: 1}) // Increment field by count
  .commit() // Perform the patch and return a promise
  .then(() => {
    console.log('Hurray, the bike is updated!')
  })
  .catch(err => {
    console.error('Oh no, the update failed: ', err.message)
  })
```

`client.data.patch(docId).set(partialDoc).inc({key: value}).commit()`

Modify a document. `patch` takes a document ID. `set` merges the partialDoc with the stored document. `inc` increments the given field with the given numeric value. `commit` executes the given `patch`.


## Delete a document

```js
client.data.delete('bikeshop/bike-123')
  .then(res => {
    console.log('Bike deleted')
  })
  .catch(err => {
    console.error('Delete failed: ', err.message)
  })
```

`client.data.delete(docId)`

Delete a document. Parameter is a document ID.

## Multiple mutations in a transaction

```js
const namePatch = client.data
  .patch('bikeshop/bike-310')
  .set({name: 'A Bike To Go'})

client.data.transaction()
  .create({name: 'Bengler Tandem Extraordinaire', seats: 2})
  .delete('bikeshop/bike-123')
  .patch(namePatch)
  .commit()
  .then(res => {
    console.log('Whole lot of stuff just happened')
  })
  .catch(err => {
    console.error('Transaction failed: ', err.message)
  })
```
`client.data.transaction().create(doc).delete(docId).patch(patch).commit()`

Create a transaction to perform chained mutations.


```js
client.data.transaction()
  .create({name: 'Bengler Tandem Extraordinaire', seats: 2})
  .patch('bikeshop/bike-123', p => p.set({inStock: false}))
  .commit()
  .then(res => {
    console.log('Bike created and a different bike is updated')
  })
  .catch(err => {
    console.error('Transaction failed: ', err.message)
  })
```

`client.data.transaction().create(doc).patch(docId, p => p.set(partialDoc)).commit()`

A `patch` can be performed inline on a `transaction`.


## Clientless patches & transactions

Transactions and patches can also be built outside the scope of a client:

```js
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop'
})

// Patches:
const patch = new sanityClient.Patch('<documentId>')
client.data.mutate(patch.inc({count: 1}).unset(['visits']))

// Transactions:
const transaction = new sanityClient.Transaction()
  .create({_id: 'foo/123', name: 'FooBike'})
  .delete('foo/bar')

client.data.mutate(transaction)
```

`const patch = new sanityClient.Patch(docId)`

`const transaction = new sanityClient.Transaction()`

A few notes on this approach:

* You cannot call `commit()` on transactions or patches instantiated this way, instead you have to pass them to `client.data.mutate()`
* Documents passed to `create`, `createIfMissing` and `createOrReplace` needs to include an `_id` property, since it cannot infer which dataset it should belong to. If you want Sanity to auto-generate one for you, set `_id` to `<datasetName>/`

## Get client configuration

```js
const config = client.config()
console.log(config.dataset)
```

`client.config()`

Get client configuration.


## Set client configuration

```js
client.config({dataset: 'newDataset'})
```

`client.config(options)`

Set client configuration. Required options are `projectId`, `dataset` and `token`.
