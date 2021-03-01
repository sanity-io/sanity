module.exports = (url) => {
  const docs = []
  for (let i = 1; i <= 60; i++) {
    docs.push({
      documentId: `doc_${i}`,
      path: 'some.path',
      url: url,
      type: 'image',
    })
  }

  return docs
}
