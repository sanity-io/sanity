# @sanity/client

[![npm version](https://img.shields.io/npm/v/@sanity/client.svg?style=flat-square)](https://www.npmjs.com/package/@sanity/client)

Javascript client for Sanity. Works in node.js and modern browsers (older browsers needs a [Promise polyfill](https://www.sanity.io/help/js-client-promise-polyfill)).

## Requirements

Sanity Client requires the JavaScript runtime to have a global ES6-compliant `Promise` available. If your runtime environment doesn't provide a spec compliant `Promise` implementation, we recommend using [native-promise-only](https://www.npmjs.com/package/native-promise-only), [es6-promise](https://www.npmjs.com/package/es6-promise) or another [spec-compliant](https://promisesaplus.com/implementations) implementation. See [this article](https://www.sanity.io/help/js-client-promise-polyfill) for more information.

## Installation

The client can be installed from npm:

```
npm install -g @sanity/client
```

## API

```js
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop',
  apiVersion: '2021-03-25', // use current UTC date - see "specifying API version"!
  token: 'sanity-auth-token', // or leave blank for unauthenticated usage
  useCdn: true, // `false` if you want to ensure fresh data
})
```

`const client = sanityClient(options)`

Initializes a new Sanity Client. Required options are `projectId`, `dataset`, and `apiVersion`. Setting a value for `useCdn` is encouraged.

### Specifying API version

Sanity uses ISO dates (YYYY-MM-DD) in UTC timezone for versioning. The explanation for this can be found [in the documentation](http://sanity.io/docs/api-versioning)

In general, unless you know what API version you want to use, you'll want to set it to today's UTC date. By doing this, you'll get all the latest bugfixes and features, while locking the API to prevent breaking changes.

**Note**: Do not be tempted to use a dynamic value for the `apiVersion`. The reason for setting a static value is to prevent unexpected, breaking changes.

In future versions, specifying an API version will be required. For now (to maintain backwards compatiblity) not specifying a version will trigger a deprecation warning and fall back to using `v1`.

### Performing queries

```js
const query = '*[_type == "bike" && seats >= $minSeats] {name, seats}'
const params = {minSeats: 2}

client.fetch(query, params).then((bikes) => {
  console.log('Bikes with more than one seat:')
  bikes.forEach((bike) => {
    console.log(`${bike.name} (${bike.seats} seats)`)
  })
})
```

`client.fetch(query, params = {})`

Perform a query using the given parameters (if any).

### Listening to queries

```js
const query = '*[_type == "comment" && authorId != $ownerId]'
const params = {ownerId: 'bikeOwnerUserId'}

const subscription = client.listen(query, params).subscribe((update) => {
  const comment = update.result
  console.log(`${comment.author} commented: ${comment.text}`)
})

// to unsubscribe later on
subscription.unsubscribe()
```

`client.listen(query, params = {}, options = {includeResult: true})`

Open a query that listens for updates on matched documents, using the given parameters (if any). The return value is an [RxJS Observable](https://rxjs.dev/guide/observable). When calling `.subscribe()` on the returned observable, a [subscription](https://rxjs.dev/api/index/class/Subscription) is returned, and this can be used to unsubscribe from the query later on by calling `subscription.unsubscribe()`

The update events which are emitted always contain `mutation`, which is an object containing the mutation which triggered the document to appear as part of the query.

By default, the emitted update event will also contain a `result` property, which contains the document with the mutation applied to it. In case of a delete mutation, this property will not be present, however. You can also tell the client not to return the document (to save bandwidth, or in cases where the mutation or the document ID is the only relevant factor) by setting the `includeResult` property to `false` in the options.

Likewise, you can also have the client return the document _before_ the mutation was applied, by setting `includePreviousRevision` to `true` in the options, which will include a `previous` property in each emitted object.

### Fetch a single document

This will fetch a document from the [Doc endpoint](https://www.sanity.io/docs/http-doc). This endpoint cuts through any caching/indexing middleware that may involve delayed processing. As it is less scalable/performant than the other query mechanisms, it should be used sparingly. Performing a query is usually a better option.

```js
client.getDocument('bike-123').then((bike) => {
  console.log(`${bike.name} (${bike.seats} seats)`)
})
```

### Fetch multiple documents in one go

This will fetch multiple documents in one request from the [Doc endpoint](https://www.sanity.io/docs/http-doc). This endpoint cuts through any caching/indexing middleware that may involve delayed processing. As it is less scalable/performant than the other query mechanisms, it should be used sparingly. Performing a query is usually a better option.

```js
client.getDocuments(['bike123', 'bike345']).then(([bike123, bike345]) => {
  console.log(`Bike 123: ${bike123.name} (${bike123.seats} seats)`)
  console.log(`Bike 345: ${bike345.name} (${bike345.seats} seats)`)
})
```

Note: Unlike in the HTTP API, the order/position of documents is _preserved_ based on the original array of IDs. If any of the documents are missing, they will be replaced by a `null` entry in the returned array:

```js
const ids = ['bike123', 'nonexistent-document', 'bike345']
client.getDocuments(ids).then((docs) => {
  // the docs array will be:
  // [{_id: 'bike123', ...}, null, {_id: 'bike345', ...}]
})
```

### Creating documents

```js
const doc = {
  _type: 'bike',
  name: 'Sanity Tandem Extraordinaire',
  seats: 2,
}

client.create(doc).then((res) => {
  console.log(`Bike was created, document ID is ${res._id}`)
})
```

`client.create(doc)`

Create a document. Argument is a plain JS object representing the document. It must contain a `_type` attribute. It _may_ contain an `_id`. If an ID is not specified, it will automatically be created.

To create a draft document, add an `_id` attribute set to `'drafts.'`.

### Creating/replacing documents

```js
const doc = {
  _id: 'my-bike',
  _type: 'bike',
  name: 'Sanity Tandem Extraordinaire',
  seats: 2,
}

client.createOrReplace(doc).then((res) => {
  console.log(`Bike was created, document ID is ${res._id}`)
})
```

`client.createOrReplace(doc)`

If you are not sure whether or not a document exists but want to overwrite it if it does, you can use the `createOrReplace()` method. When using this method, the document must contain an `_id` attribute.

### Creating if not already present

```js
const doc = {
  _id: 'my-bike',
  _type: 'bike',
  name: 'Sanity Tandem Extraordinaire',
  seats: 2,
}

client.createIfNotExists(doc).then((res) => {
  console.log('Bike was created (or was already present)')
})
```

`client.createIfNotExists(doc)`

If you want to create a document if it does not already exist, but fall back without error if it does, you can use the `createIfNotExists()` method. When using this method, the document must contain an `_id` attribute.

### Patch/update a document

```js
client
  .patch('bike-123') // Document ID to patch
  .set({inStock: false}) // Shallow merge
  .inc({numSold: 1}) // Increment field by count
  .commit() // Perform the patch and return a promise
  .then((updatedBike) => {
    console.log('Hurray, the bike is updated! New document:')
    console.log(updatedBike)
  })
  .catch((err) => {
    console.error('Oh no, the update failed: ', err.message)
  })
```

Modify a document. `patch` takes a document ID. `set` merges the partialDoc with the stored document. `inc` increments the given field with the given numeric value. `commit` executes the given `patch`. Returns the updated object.

### Setting a field only if not already present

```js
client.patch('bike-123').setIfMissing({title: 'Untitled bike'}).commit()
```

### Removing/unsetting fields

```js
client.patch('bike-123').unset(['title', 'price']).commit()
```

### Incrementing/decrementing numbers

```js
client
  .patch('bike-123')
  .inc({price: 88, numSales: 1}) // Increment `price` by 88, `numSales` by 1
  .dec({inStock: 1}) // Decrement `inStock` by 1
  .commit()
```

### Patch a document only if revision matches

You can use the `ifRevisionId(rev)` method to specify that you only want the patch to be applied if the stored document matches a given revision.

```js
client
  .patch('bike-123')
  .ifRevisionId('previously-known-revision')
  .set({title: 'Little Red Tricycle'})
  .commit()
```

### Adding elements to an array

The patch operation `insert` takes a location (`before`, `after` or `replace`), a path selector and an array of elements to insert.

```js
const {nanoid} = require('nanoid')

client
  .patch('bike-123')
  // Ensure that the `reviews` arrays exists before attempting to add items to it
  .setIfMissing({reviews: []})
  // Add the items after the last item in the array (append)
  .insert('after', 'reviews[-1]', [
    // Add a `_key` unique within the array to ensure it can be addressed uniquely
    // in a real-time collaboration context
    {_key: nanoid(), title: 'Great bike!', stars: 5},
  ])
  .commit()
```

### Appending/prepending elements to an array

The operations of appending and prepending to an array are so common that they have been given their own methods for better readability:

```js
const {nanoid} = require('nanoid')

client
  .patch('bike-123')
  .setIfMissing({reviews: []})
  .append('reviews', [{_key: nanoid(), title: 'Great bike!', stars: 5}])
  .commit()
```

### Deleting an element from an array

Each entry in the `unset` array can be either an attribute or a JSON path.

In this example, we remove the first review and the review with `_key: 'abc123'` from the `bike.reviews` array:

```js
const reviewsToRemove = ['reviews[0]', 'reviews[_key=="abc123"]']
client.patch('bike-123').unset(reviewsToRemove).commit()
```

### Delete documents

A single document can be deleted by specifying a document ID:

`client.delete(docId)`

```js
client
  .delete('bike-123')
  .then(() => {
    console.log('Bike deleted')
  })
  .catch((err) => {
    console.error('Delete failed: ', err.message)
  })
```

One or more documents can be deleted by specifying a GROQ query (and optionally, `params`):

`client.delete({ query: "GROQ query", params: { key: value } })`

```js
// Without params

client
  .delete({ query: '*[_type == "bike"][0]' })
  .then(() => {
    console.log('The document matching *[_type == "bike"][0] was deleted')
  })
  .catch((err) => {
    console.error('Delete failed: ', err.message)
  })
```

```js
// With params

client
  .delete({ query: '*[_type == $type][0..1]', params: { type: 'bike' } })
  .then(() => {
    console.log('The documents matching *[_type == "bike"][0..1] was deleted')
  })
  .catch((err) => {
    console.error('Delete failed: ', err.message)
  })
```

### Multiple mutations in a transaction

```js
const namePatch = client.patch('bike-310').set({name: 'A Bike To Go'})

client
  .transaction()
  .create({name: 'Sanity Tandem Extraordinaire', seats: 2})
  .delete('bike-123')
  .patch(namePatch)
  .commit()
  .then((res) => {
    console.log('Whole lot of stuff just happened')
  })
  .catch((err) => {
    console.error('Transaction failed: ', err.message)
  })
```

`client.transaction().create(doc).delete(docId).patch(patch).commit()`

Create a transaction to perform chained mutations.

```js
client
  .transaction()
  .create({name: 'Sanity Tandem Extraordinaire', seats: 2})
  .patch('bike-123', (p) => p.set({inStock: false}))
  .commit()
  .then((res) => {
    console.log('Bike created and a different bike is updated')
  })
  .catch((err) => {
    console.error('Transaction failed: ', err.message)
  })
```

`client.transaction().create(doc).patch(docId, p => p.set(partialDoc)).commit()`

A `patch` can be performed inline on a `transaction`.

### Clientless patches & transactions

Transactions and patches can also be built outside the scope of a client:

```js
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop',
})

// Patches:
const patch = new sanityClient.Patch('<documentId>')
client.mutate(patch.inc({count: 1}).unset(['visits']))

// Transactions:
const transaction = new sanityClient.Transaction()
  .create({_id: '123', name: 'FooBike'})
  .delete('someDocId')

client.mutate(transaction)
```

`const patch = new sanityClient.Patch(docId)`

`const transaction = new sanityClient.Transaction()`

An important note on this approach is that you cannot call `commit()` on transactions or patches instantiated this way, instead you have to pass them to `client.mutate()`

### Uploading assets

Assets can be uploaded using the `client.assets.upload(...)` method.

```
client.assets.upload(type: 'file' | image', body: File | Blob | Buffer | NodeStream, options = {}): Promise<AssetDocument>
```

👉 Read more about [assets in Sanity](https://sanity.io/docs/http-api/assets)

#### Examples: Uploading assets from Node.js

```js
// Upload a file from the file system
client.assets
  .upload('file', fs.createReadStream('myFile.txt'), {filename: 'myFile.txt'})
  .then((document) => {
    console.log('The file was uploaded!', document)
  })
  .catch((error) => {
    console.error('Upload failed:', error.message)
  })
```

```js
// Upload an image file from the file system
client.assets
  .upload('image', fs.createReadStream('myImage.jpg'), {filename: 'myImage.jpg'})
  .then((document) => {
    console.log('The image was uploaded!', document)
  })
  .catch((error) => {
    console.error('Upload failed:', error.message)
  })
```

#### Examples: Uploading assets from the Browser

```js
// Create a file with "foo" as its content
const file = new File(['foo'], 'foo.txt', {type: 'text/plain'})
// Upload it
client.assets
  .upload('file', file)
  .then((document) => {
    console.log('The file was uploaded!', document)
  })
  .catch((error) => {
    console.error('Upload failed:', error.message)
  })
```

```js
// Draw something on a canvas and upload as image
const canvas = document.getElementById('someCanvas')
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#f85040'
ctx.fillRect(0, 0, 50, 50)
ctx.fillStyle = '#fff'
ctx.font = '10px monospace'
ctx.fillText('Sanity', 8, 30)
canvas.toBlob(uploadImageBlob, 'image/png')

function uploadImageBlob(blob) {
  client.assets
    .upload('image', blob, {contentType: 'image/png', filename: 'someText.png'})
    .then((document) => {
      console.log('The image was uploaded!', document)
    })
    .catch((error) => {
      console.error('Upload failed:', error.message)
    })
}
```

#### Examples: Specify image metadata to extract

```js
// Extract palette of colors as well as GPS location from exif
client.assets
  .upload('image', someFile, {extract: ['palette', 'location']})
  .then((document) => {
    console.log('The file was uploaded!', document)
  })
  .catch((error) => {
    console.error('Upload failed:', error.message)
  })
```

### Deleting an asset

Deleting an asset document will also trigger deletion of the actual asset.

```
client.delete(id: string): Promise
```

```js
client.delete('image-abc123_someAssetId-500x500-png').then((result) => {
  console.log('deleted imageAsset', result)
})
```

### Get client configuration

```js
const config = client.config()
console.log(config.dataset)
```

`client.config()`

Get client configuration.

### Set client configuration

```js
client.config({dataset: 'newDataset'})
```

`client.config(options)`

Set client configuration. Required options are `projectId` and `dataset`.
