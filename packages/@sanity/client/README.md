# @sanity/client

[![npm version](https://img.shields.io/npm/v/@sanity/client.svg?style=flat-square)](https://www.npmjs.com/package/@sanity/client)

Javascript client for Sanity. Works in node.js and modern browsers (older browsers needs a [Promise polyfill](https://www.sanity.io/help/js-client-promise-polyfill)).

## Requirements

Sanity Client requires the JavaScript runtime to have a global ES6-compliant `Promise` available. If your runtime environment doesn't provide a spec compliant `Promise` implementation, we recommend using [native-promise-only](https://www.npmjs.com/package/native-promise-only), [es6-promise](https://www.npmjs.com/package/es6-promise) or another [spec-compliant](https://promisesaplus.com/implementations) implementation. See [this article](https://www.sanity.io/help/js-client-promise-polyfill) for more information.

## Installation

The client can be installed from npm:

```
npm install --save @sanity/client
```

## API

```js
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop',
  token: 'sanity-auth-token', // or leave blank to be anonymous user
  useCdn: true // `false` if you want to ensure fresh data
})
```

`const client = sanityClient(options)`

Initializes a new Sanity Client. Required options are `projectId` and `dataset`.

### Fetch a single document

```js
client.getDocument('bike-123').then(bike => {
  console.log(`${bike.name} (${bike.seats} seats)`)
})
```

### Performing queries

```js
const query = '*[_type == "bike" && seats >= $minSeats] {name, seats}'
const params = {minSeats: 2}

client.fetch(query, params).then(bikes => {
  console.log('Bikes with more than one seat:')
  bikes.forEach(bike => {
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

const subscription = client.listen(query, params)
  .subscribe(comment => {
    console.log(`${comment.author} commented: ${comment.text}`)
  })
```

`client.listen(query, params = {}, options = {includeResult: true})`

Open a query that listens for updates on matched documents, using the given parameters (if any). The return value is an [Observable](https://github.com/sanity-io/sanity/tree/master/packages/@sanity/observable). When calling `subscribe()` on the observable, a subscription is returned which can be used to unsubscribe from the query.

The objects which are emitted always contain `mutation`, which is an object containing the mutation which triggered the document to appear as part of the query.

By default, the emitted object will also contain a `result` property, which contains the document with the mutation applied to it. In case of a delete mutation, this property will not be present, however. You can also tell the client not to return the document (to save bandwidth, or in cases where the mutation or the document ID is the only relevant factor) by setting the `includeResult` property to `false` in the options.

Likewise, you can also have the client return the document *before* the mutation was applied, by setting`includePreviousRevision` to `true` in the options, which will include a `previous` property in each emitted object.

### Creating documents

```js
const doc = {
  _type: 'bike',
  name: 'Sanity Tandem Extraordinaire',
  seats: 2
}

client.create(doc).then(res => {
  console.log(`Bike was created, document ID is ${res._id}`)
})
```

`client.create(doc)`

Create a document. Argument is a plain JS object representing the document. It must contain a `_type` attribute. It *may* contain an `_id`. If an ID is not specified, it will automatically be created.


### Creating/replacing documents

```js
const doc = {
  _id: 'my-bike',
  _type: 'bike',
  name: 'Sanity Tandem Extraordinaire',
  seats: 2
}

client.createOrReplace(doc).then(res => {
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
  seats: 2
}

client.createIfNotExists(doc).then(res => {
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
  .then(updatedBike => {
    console.log('Hurray, the bike is updated! New document:')
    console.log(updatedBike)
  })
  .catch(err => {
    console.error('Oh no, the update failed: ', err.message)
  })
```

`client.patch(docId).set(partialDoc).inc({key: value}).commit()`

Modify a document. `patch` takes a document ID. `set` merges the partialDoc with the stored document. `inc` increments the given field with the given numeric value. `commit` executes the given `patch`. Returns the updated object.

### Patch a document only if revision matches

You can use the `ifRevisionId(rev)` method to specify that you only want the patch to be applied if the stored document matches a given revision.

```js
client
  .patch('bike-123')
  .ifRevisionId('previously-known-revision')
  .set({title: 'Little Red Tricycle'})
  .commit()
```

### Delete a document

```js
client.delete('bike-123')
  .then(res => {
    console.log('Bike deleted')
  })
  .catch(err => {
    console.error('Delete failed: ', err.message)
  })
```

`client.delete(docId)`

Delete a document. Parameter is a document ID.

### Multiple mutations in a transaction

```js
const namePatch = client
  .patch('bike-310')
  .set({name: 'A Bike To Go'})

client
  .transaction()
  .create({name: 'Sanity Tandem Extraordinaire', seats: 2})
  .delete('bike-123')
  .patch(namePatch)
  .commit()
  .then(res => {
    console.log('Whole lot of stuff just happened')
  })
  .catch(err => {
    console.error('Transaction failed: ', err.message)
  })
```

`client.transaction().create(doc).delete(docId).patch(patch).commit()`

Create a transaction to perform chained mutations.

```js
client
  .transaction()
  .create({name: 'Sanity Tandem Extraordinaire', seats: 2})
  .patch('bike-123', p => p.set({inStock: false}))
  .commit()
  .then(res => {
    console.log('Bike created and a different bike is updated')
  })
  .catch(err => {
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
  dataset: 'bikeshop'
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
client.asset.upload(type: 'file' | image', body: File | Blob | Buffer | NodeStream, options = {}): Promise<AssetDocument>
```

👉 Read more about [assets in Sanity](https://sanity.io/docs/http-api/assets)

#### Examples: Uploading assets from Node.js
```js
// Upload a file from the file system
client.assets.upload('file', fs.createReadStream('myFile.txt'))
  .then(document => {
    console.log('The file was uploaded!', document)
  })
  .catch(error => {
    console.error('Upload failed:', error.message)
  })
````
```js

// Upload an image file from the file system
client.assets.upload('image', fs.createReadStream('myImage.jpg'))
  .then(document => {
    console.log('The image was uploaded!', document)
  })
  .catch(error => {
    console.error('Upload failed:', error.message)
  })
```

#### Examples: Uploading assets from the Browser
```js
// Create a file with "foo" as its content
const file = new File(["foo"], "foo.txt", {type: "text/plain"})
// Upload it
client.assets.upload('file', file)
  .then(document => {
    console.log('The file was uploaded!', document)
  })
  .catch(error => {
    console.error('Upload failed:', error.message)
  })
````

```js
// Draw something on a canvas and upload as image
const canvas = document.getElementById('someCanvas')
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#f85040'
ctx.fillRect(0, 0, 50, 50);
ctx.fillStyle = '#fff'
ctx.font = '10px monospace'
ctx.fillText('Sanity', 8, 30)
canvas.toBlob(uploadImageBlob, 'image/png')

function uploadImageBlob(blob) {
  client.assets.upload('image', blob)
    .then(document => {
      console.log('The image was uploaded!', document)
    })
    .catch(error => {
      console.error('Upload failed:', error.message)
    })
}
```

#### Examples: Specify image metadata to extract
```js
// Extract palette of colors as well as GPS location from exif
client.assets.upload('image', someFile, {extract: ['palette', 'location']})
  .then(document => {
    console.log('The file was uploaded!', document)
  })
  .catch(error => {
    console.error('Upload failed:', error.message)
  })
````

### Deleting an asset

Deleting an asset document will also trigger deletion of the actual asset.

```
client.delete(id: string): Promise
```

```js
client.delete('image-abc123_someAssetId-500x500-png')
  .then(result => {
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
