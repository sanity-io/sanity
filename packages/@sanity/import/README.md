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
  useCdn: false,
})

// Input can either be a readable stream (for a `.tar.gz` or `.ndjson` file), a folder location (string), or an array of documents
const input = fs.createReadStream('my-documents.ndjson')

const options = {
  /**
   * A Sanity client instance, preconfigured with the project ID and dataset
   * you want to import data to, and with a token that has write access.
   */
  client: client,

  /**
   * Which mutation type to use for creating documents:
   * `create` (default)  - throws error if document IDs already exists
   * `createOrReplace`   - replaces documents with same IDs
   * `createIfNotExists` - skips document with IDs that already exists
   *
   * Optional.
   */
  operation: 'create',

  /**
   * Function called when making progress. Gets called with an object of
   * the following shape:
   * `step` (string) - the current step name of the import process
   * `current` (number) - the current progress of the step, only present on some steps
   * `total` (number) - total items before complete, only present on some steps
   */
  onProgress: (progress) => {
    /* report progress */
  },

  /**
   * Whether or not to allow assets in different datasets. This is usually
   * an error in the export, where asset documents are part of the export.
   *
   * Optional, defaults to `false`.
   */
  allowAssetsInDifferentDataset: false,

  /**
   * Whether or not to allow failing assets due to download/upload errors.
   *
   * Optional, defaults to `false`.
   */
  allowFailingAssets: false,

  /**
   * Whether or not to replace any existing assets with the same hash.
   * Setting this to `true` will regenerate image metadata on the server,
   * but slows down the import.
   *
   * Optional, defaults to `false`.
   */
  replaceAssets: false,

  /**
   * Whether or not to skip cross-dataset references. This may be required
   * when importing a dataset with cross-dataset references to a different
   * project, unless a dataset with the referenced name exists.
   *
   * Optional, defaults to `false`.
   */
  skipCrossDatasetReferences: false,
}

sanityImport(input, options)
  .then(({numDocs, warnings}) => {
    console.log('Imported %d documents', numDocs)
    // Note: There might be warnings! Check `warnings`
  })
  .catch((err) => {
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
