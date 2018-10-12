# @sanity/import

Imports documents from an [ndjson](http://ndjson.org/)-stream to a Sanity dataset

## Installing

```
npm install --save @sanity/import
```

## Usage

```js
const fs = require('fs')
const sanityClient = require('@sanity/client')
const sanityImport = require('@sanity/import')

const client = sanityClient({
  projectId: '<your project id>',
  dataset: '<your target dataset>',
  token: '<token-with-write-perms>',
  useCdn: false
})

// Input can either be a readable stream (for a `.tar.gz` or `.ndjson` file), a folder location (string), or an array of documents
const input = fs.createReadStream('my-documents.ndjson')
sanityImport(input, {
  client: client,
  operation: 'create' // `create`, `createOrReplace` or `createIfNotExists`
})
  .then(({numDocs, warnings}) => {
    console.log('Imported %d documents', numDocs)
    // Note: There might be warnings! Check `warnings`
  })
  .catch(err => {
    console.error('Import failed: %s', err.message)
  })
```

## CLI-tool

This functionality is built in to the `@sanity/cli` package as well as a standalone [@sanity/import-cli](https://www.npmjs.com/package/@sanity/import-cli) package.

## Future improvements

- When documents are imported, record which IDs are actually touched
  - Only upload assets for documents that are still within that window
  - Only strengthen references for documents that are within that window
  - Only count number of imported documents from within that window
- Asset uploads and strengthening can be done in parallel, but we need a way to cancel the operations if one of the operations fail
- Introduce retrying of asset uploads based on hash + indexing delay
- Validate that dataset exists upon start
- Reference verification
  - Create a set of all document IDs in import file
  - Create a set of all document IDs in references
  - Create a set of referenced ID that do not exist locally
  - Batch-wise, check if documents with missing IDs exist remotely
  - When all missing IDs have been cross-checked with the remote API
    (or a max of say 100 items have been found missing), reject with
    useful error message.

## License

MIT-licensed. See LICENSE.
