export const DRAFTS_FOLDER = 'drafts'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}.`

export function isDraft(document) {
  return isDraftId(document._id)
}

export function isDraftId(id) {
  return id.startsWith(DRAFTS_PREFIX)
}

export function isPublishedId(id) {
  return !isDraftId(id)
}

export function getDraftId(id) {
  return isDraftId(id) ? id : DRAFTS_PREFIX + id
}

export function getPublishedId(id) {
  return isDraftId(id) ? id.slice(DRAFTS_PREFIX.length) : id
}

export function createDraftFrom(document) {
  return {
    _id: getDraftId(document._id),
    ...document,
  }
}

export function newDraftFrom(document) {
  return {
    _id: DRAFTS_PREFIX,
    ...document,
  }
}

export function createPublishedFrom(document) {
  return {
    _id: getPublishedId(document._id),
    ...document,
  }
}

// Takes a list of documents and collates draft/published pairs into single entries
// {id: <published id>, draft?: <draft document>, published?: <published document>}
export function collate(documents) {
  const byId = documents.reduce((res, doc) => {
    const id = getPublishedId(doc._id)
    let entry = res.get(id)
    if (!entry) {
      entry = {id}
      res.set(id, entry)
    }

    entry[id === doc._id ? 'published' : 'draft'] = doc
    return res
  }, new Map())

  return Array.from(byId.values())
}

// Removes published documents that also has a draft
export function removeDupes(documents) {
  return collate(documents).map((entry) => entry.draft || entry.published)
}
