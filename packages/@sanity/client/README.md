# Sanity client

A thin wrapper around https://github.com/sanity-io/gradient-client


## Usage

`npm i --save @sanity/client-next`

```js
import sanityClient from '@sanity/client-next'
const client = sanityClient({
  url: 'https://gradient.url',
  dataset: 'foo',
  token: 'gradient-auth-token'
})
```

### Fetch
```js
const query = 'foo.comment[] {.body, .createdAt}'
client.fetch('query').then(res => {
  // {
  //   transactionId: 'bar',
  //   result: [{comment1}, {comment2}]
  // }
})
```
Check out https://github.com/sanity-io/gradientql to see how queries are composed.


### Create
```js
const doc = {title: 'Baloney'}
client.create(doc).then(res => {
  // {
  //   transactionId: 'bar',
  //   docIds: ['foo:99']
  // }
})
```

### Update
```js
const patch = {description: 'new desc'}
return client.update('foo:99', patch).then(res => {
  //
})
```

### Delete
```js
return client.delete('foo').then(res => {
  // {transactionId: 'bar'}
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
