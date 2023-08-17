function reduceDuplicateIds(ids, doc) {
  if (!doc._id) {
    return ids
  }

  if (ids.seen.includes(doc._id)) {
    ids.duplicates.push(doc._id)
  } else {
    ids.seen.push(doc._id)
  }

  return ids
}

module.exports = function ensureUniqueIds(documents) {
  const {duplicates} = documents.reduce(reduceDuplicateIds, {
    seen: [],
    duplicates: [],
  })

  const numDupes = duplicates.length
  if (numDupes === 0) {
    return
  }

  throw new Error(
    `Found ${numDupes} duplicate IDs in the source file:\n- ${duplicates.join('\n- ')}`,
  )
}
