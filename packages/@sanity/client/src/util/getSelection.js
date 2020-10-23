module.exports = function getSelection(sel) {
  if (typeof sel === 'string' || Array.isArray(sel)) {
    return {id: sel}
  }

  if (sel && sel.query) {
    return {query: sel.query, params: sel.params}
  }

  const selectionOpts = [
    '* Document ID (<docId>)',
    '* Array of document IDs',
    '* Object containing `query`'
  ].join('\n')

  throw new Error(`Unknown selection - must be one of:\n\n${selectionOpts}`)
}
