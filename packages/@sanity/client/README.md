# Sanity client

Javascript client for Sanity. Works in browsers (IE8+) and node.js.

## Installation

The client can be installed from npm:

```
npm install --save @sanity/client-next
```

## Usage

```js
const sanityClient = require('@sanity/client-next')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop',
  token: 'sanity-auth-token' // or leave blank to be anonymous user
})
```

### Performing queries

```js
const query = 'bikeshop.bikes[.seats > 1] {.name, .seats}'
client.data.fetch(query).then(bikes => {
  console.log('Bikes with more than one seat:')
  bikes.forEach(bike => {
    console.log(`${bike.name} (${bike.seats} seats)`)
  })
})
```


### Creating documents

```js
const doc = {name: 'Bengler Tandem Extraordinaire', seats: 2}
client.data.create(doc).then(res => {
  console.log(`Bike was created, document ID is ${res.documentId}`)
})
```

### Patch/update a document

```js
client.data
  .patch('bikeshop:bike-123') // Document ID to patch
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

### Delete a document

```js
client.data.delete('bikeshop:bike-123')
  .then(res => {
    console.log('Bike deleted')
  })
  .catch(err => {
    console.error('Delete failed: ', err.message)
  })
```

### Multiple mutations in a transaction

```js
const namePatch = client.data
  .patch('bikeshop:bike-310')
  .set({name: 'A Bike To Go'})

client.data.transaction()
  .create({name: 'Bengler Tandem Extraordinaire', seats: 2})
  .delete('bikeshop:bike-123')
  .patch(namePatch)
  .commit()
  .then(res => {
    console.log('Whole lot of stuff just happened')
  })
  .catch(err => {
    console.error('Transaction failed: ', err.message)
  })
```

Patches can also be built inline:

```js
client.data.transaction()
  .create({name: 'Bengler Tandem Extraordinaire', seats: 2})
  .patch('bikeshop:bike-123', p => p.set({inStock: false}))
  .commit()
  .then(res => {
    console.log('Bike created and a different bike is updated')
  })
  .catch(err => {
    console.error('Transaction failed: ', err.message)
  })
```

Transactions and patches can also be built outside the scope of a client:

```js
const sanityClient = require('@sanity/client-next')
const client = sanityClient({
  projectId: 'your-project-id',
  dataset: 'bikeshop'
})

// Patches:
const patch = new sanityClient.Patch('<documentId>')
client.data.mutate(patch.inc({count: 1}).unset(['visits']))

// Transactions:
const transcation = new sanityClient.Transaction()
  .create({$id: 'foo:123', name: 'FooBike'})
  .delete('foo:bar')

client.data.mutate(transaction)
```

A few notes on this approach, however:

* You cannot call `commit()` on transactions or patches instantiated this way, instead you have to pass them to `client.data.mutate()`
* Documents passed to `create`, `createIfMissing` and `createOrReplace` needs to include an `$id` property, since it cannot infer which dataset it should belong to. If you want Sanity to auto-generate one for you, set `$id` to `<datasetName:>`

### Get client configuration

```js
const config = client.config()
console.log(config.dataset)
```

### Set client configuration

```js
client.config({dataset: 'newDataset'})
```

Yes, these examples use ES6-flavored JS.

![Deal with it](http://i.imgur.com/ZGxjoYC.gif)
