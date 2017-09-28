# Sanity document window

Give it a query and it will keep that window up to date with changes.

## Installing

```
npm install --save @sanity/document-window
```

## Warning ⚠

API is still in flux and is likely to change in the near future. Use at your own risk.

## Usage

```js
const SanityClient = require('@sanity/client')
const DocumentWindow = require('@sanity/document-window')

const client = new SanityClient({
  projectId: 'your-project-id',
  dataset: 'some-dataset',
  useCdn: true
})

const query = new DocumentWindow.Query()
  .constraint('_type == $type && numSeats >= 2')
  .params({type: 'product'})
  .order([['numSeats', 'desc'], ['_updatedAt', 'desc']])
  .from(0)
  .to(20)

const articleWindow = new DocumentWindow({client, query})
articleWindow.on('data', docs => {
  console.log(docs)
})
```

## License

MIT-licensed. See LICENSE.
