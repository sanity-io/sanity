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
