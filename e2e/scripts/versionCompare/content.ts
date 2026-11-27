/**
 * The content both studios show: the schema the comparison studio declares, and the documents
 * the run writes to the dataset before the Structure pages are measured. The Structure ready
 * checks look for exactly these, so they live in one place.
 */

/** Document types in the order the Structure tool's root list shows them. */
export const DOCUMENT_TYPES = [
  {name: 'post', title: 'Post'},
  {name: 'author', title: 'Author'},
  {name: 'category', title: 'Category'},
] as const

/** The post the deep link opens. */
export const OPENED_POST = {id: 'version-compare-post', title: 'Opened by the deep link'}

/** Posts in the dataset besides the opened one, so the document list has rows to render. */
const LISTED_POSTS = 20

export const STRUCTURE_PATH = '/structure'
export const DOCUMENT_PATH = `/structure/post;${OPENED_POST.id}`

/** The `schema.types` literal of the studio config. */
export function renderSchemaTypes(): string {
  const fields: Record<(typeof DOCUMENT_TYPES)[number]['name'], string> = {
    author: `[{name: 'name', title: 'Name', type: 'string'}]`,
    category: `[{name: 'title', title: 'Title', type: 'string'}]`,
    post: `[
        {name: 'title', title: 'Title', type: 'string'},
        {name: 'body', title: 'Body', type: 'text'},
      ]`,
  }
  const types = DOCUMENT_TYPES.map(
    ({name, title}) =>
      `    {
      name: ${JSON.stringify(name)},
      title: ${JSON.stringify(title)},
      type: 'document',
      fields: ${fields[name]},
    },`,
  )
  return `[\n${types.join('\n')}\n  ]`
}

function seedDocuments(): Array<Record<string, string>> {
  const posts = Array.from({length: LISTED_POSTS}, (_, index) => ({
    _id: `version-compare-post-${index + 1}`,
    _type: 'post',
    body: `Body of post ${index + 1}.`,
    title: `Post ${index + 1}`,
  }))
  return [
    {
      _id: OPENED_POST.id,
      _type: 'post',
      body: 'The document the deep link opens.',
      title: OPENED_POST.title,
    },
    ...posts,
    {_id: 'version-compare-author', _type: 'author', name: 'An author'},
    {_id: 'version-compare-category', _type: 'category', title: 'A category'},
  ]
}

/** Writes the documents as published ones; replacing them keeps reruns on one dataset stable. */
export async function seedContent(options: {
  apiHost: string
  dataset: string
  projectId: string
  token: string
}): Promise<void> {
  const {apiHost, dataset, projectId, token} = options
  const url = new URL(`/v2024-01-01/data/mutate/${dataset}`, apiHost)
  url.hostname = `${projectId}.${url.hostname}`
  const response = await fetch(url, {
    body: JSON.stringify({
      mutations: seedDocuments().map((document) => ({createOrReplace: document})),
    }),
    headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Seeding ${dataset} failed: ${response.status} ${await response.text()}`)
  }
}

const isVisible = `(el) => !!el && el.getClientRects().length > 0`

/**
 * Ready on `/structure`: the root list pane shows a visible item for every document type. The
 * items are links, so they are usable from that moment.
 */
export const STRUCTURE_READY = `() => {
    const visible = ${isVisible}
    const pane = document.querySelector('[data-testid="structure-tool-list-pane"]')
    if (!pane) return false
    return ${JSON.stringify(DOCUMENT_TYPES.map((type) => type.title))}.every((title) => {
      const item = pane.querySelector('[data-testid="pane-item-' + title + '"]')
      return visible(item) && item.textContent.trim() !== ''
    })
  }`

/**
 * Ready on the deep link: the document pane's form shows the opened post's title in an input
 * that accepts typing.
 */
export const DOCUMENT_READY = `() => {
    const visible = ${isVisible}
    const input = document.querySelector('[data-testid="document-panel-scroller"] [data-testid="field-title"] input')
    return visible(input) && input.value === ${JSON.stringify(OPENED_POST.title)} && !input.readOnly && !input.disabled
  }`
