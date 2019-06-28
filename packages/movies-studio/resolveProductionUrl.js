const SITE_URL = 'https://sanity-example-frontend.now.sh'

function stripDraftId(str) {
  return str.replace(/^drafts\./, '')
}

export default function resolveProductionUrl(document, rev) {
  const id = stripDraftId(document._id)

  if (rev) {
    // No support for historic revisions preview in movie frontend
    return null
  }

  if (document._type === 'movie') {
    return `${SITE_URL}/movie?id=${id}`
  }
  if (document._type === 'person') {
    return `${SITE_URL}/person?id=${id}`
  }
  return null
}
