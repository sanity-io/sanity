const SITE_URL = 'https://sanity-example-frontend.now.sh'

function stripDraftId(str) {
  return str.replace(/^drafts\./, '')
}

export default function resolveProductionUrl(document) {
  const id = stripDraftId(document._id)

  if (document._type === 'movie') {
    return `${SITE_URL}/movie?id=${id}`
  }
  if (document._type === 'person') {
    return `${SITE_URL}/person?id=${id}`
  }
  return null
}
