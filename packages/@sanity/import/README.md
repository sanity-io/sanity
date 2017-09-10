

## Future improvements

- When documents are imported, record which IDs are actually touched
  - Only upload assets for documents that are still within that window
  - Only strengthen references for documents that are within that window
  - Only count number of imported documents from within that window
- Asset uploads and strengthening can be done in parallel, but we need a way to cancel the operations if one of the operations fail
- Introduce retrying of asset uploads based on hash + indexing delay
- Validate that dataset exists upon start
- Separate CLI into separate package
- Reference verification
  - Create a set of all document IDs in import file
  - Create a set of all document IDs in references
  - Create a set of referenced ID that do not exist locally
  - Batch-wise, check if documents with missing IDs exist remotely
  - When all missing IDs have been cross-checked with the remote API
    (or a max of say 100 items have been found missing), reject with
    useful error message.
