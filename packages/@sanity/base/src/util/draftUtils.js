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
    ...document
  }
}

export function newDraftFrom(document) {
  return {
    _id: DRAFTS_PREFIX,
    ...document
  }
}

export function createPublishedFrom(document) {
  return {
    _id: getPublishedId(document._id),
    ...document
  }
}

// Removes published documents that also has a draft
export function removeDupes(documents) {
  const drafts = documents.map(doc => doc._id).filter(isDraftId)

  return documents.filter(doc => {
    const draftId = getDraftId(doc._id)
    const publishedId = getPublishedId(doc._id)
    const hasDraft = drafts.includes(draftId)
    const isPublished = doc._id === publishedId
    return isPublished ? !hasDraft : true
  })
}
