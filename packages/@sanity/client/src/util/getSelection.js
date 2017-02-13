module.exports = function getSelection(sel) {
  if (typeof sel === 'string' || Array.isArray(sel)) {
    return {id: sel}
  }

  if (sel && sel.query) {
    return {query: sel.query}
  }

  const selectionOpts = [
    '* Dataset-prefixed document ID (<dataset.docId>)',
    '* Array of dataset-prefixed document IDs',
    '* Object containing `query`'
  ].join('\n')

  throw new Error(`Unknown selection - must be one of:\n\n${selectionOpts}`)
}
