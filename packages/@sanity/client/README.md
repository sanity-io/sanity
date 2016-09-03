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
return client.data
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
return client.data.delete('bikeshop:bike-123')
  .then(res => {
    console.log('Bike deleted')
  })
  .catch(err => {
    console.error('Delete failed: ', err.message'
  })
```

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
