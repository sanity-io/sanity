import type {SanityClient} from 'sanity'

import type {VersionRow} from './useCorpus'

// The writes behind the C5 bulk bar. Every action here is a real Content Lake action (apiVersion X), run per row so
// one failure does not stop the others; each row reports its own result.
//   variant version:  sanity.action.document.variant.{create,publish,unpublish,delete}
//     - bundleId = 'drafts' or a release id; OMIT bundleId to act on the published variant directly
//   base document:    sanity.action.document.{publish,unpublish,delete,discard}, document.version.{create,discard}

export type Op = 'publish' | 'unpublish' | 'delete' | 'create' | 'addToRelease'

/** One row's target: a document at one address (a variant, or the base when `variantId` is null). */
export interface Target {
  docId: string
  title: string
  variantId: string | null
  /** The stored versions of this document at this address (empty for an absent row). */
  rows: VersionRow[]
}

export interface RowResult {
  docId: string
  ok: boolean
  message: string
}

type Action = Record<string, unknown>

const strip = (doc: Record<string, unknown>) => {
  const {_id, _rev, _createdAt, _updatedAt, _system, ...content} = doc
  void [_id, _rev, _createdAt, _updatedAt, _system]
  return content
}

const errorText = (e: unknown) => {
  const body = (e as {response?: {body?: {error?: {description?: string}; message?: string}}})?.response?.body
  return body?.error?.description ?? body?.message ?? (e instanceof Error ? e.message : String(e))
}

const find = (rows: readonly VersionRow[], bundle: string) => rows.find((r) => r.bundle === bundle)

/** The content to copy: the document's draft, else published, else any version it has. */
async function baseContent(client: SanityClient, docId: string, preferred?: VersionRow): Promise<Record<string, unknown>> {
  const ids = [...(preferred ? [preferred._id] : []), `drafts.${docId}`, docId]
  for (const id of ids) {
    const doc = (await client.fetch('*[_id == $id][0]', {id})) as Record<string, unknown> | null
    if (doc) return strip(doc)
  }
  const any = (await client.fetch('*[_id match "*." + $id || _id == $id][0]', {id: docId})) as Record<string, unknown> | null
  if (!any) throw new Error('The document has no version to copy.')
  return strip(any)
}

/** The actions for one op on one target. `where` is 'drafts' or a release id (create, add to release). */
export async function buildActions(client: SanityClient, op: Op, target: Target, where: string): Promise<Action[]> {
  const {docId, variantId, rows} = target
  const A = 'sanity.action.document'

  if (op === 'publish') {
    if (!find(rows, 'drafts')) throw new Error('Nothing to publish: the changes are in a release, which publishes with the release.')
    return variantId
      ? [{actionType: `${A}.variant.publish`, publishedId: docId, variantId, bundleId: 'drafts'}]
      : [{actionType: `${A}.publish`, draftId: `drafts.${docId}`, publishedId: docId}]
  }

  if (op === 'unpublish') {
    if (!find(rows, 'published')) throw new Error('Not published.')
    return variantId
      ? [{actionType: `${A}.variant.unpublish`, publishedId: docId, variantId}]
      : [{actionType: `${A}.unpublish`, draftId: `drafts.${docId}`, publishedId: docId}]
  }

  if (op === 'delete') {
    if (!rows.length) throw new Error('Nothing to delete.')
    if (variantId) {
      // Releases and the draft first, the published variant last.
      const order = [...rows.filter((r) => r.bundle !== 'published'), ...rows.filter((r) => r.bundle === 'published')]
      return order.map((r) =>
        r.bundle === 'published'
          ? {actionType: `${A}.variant.delete`, publishedId: docId, variantId}
          : {actionType: `${A}.variant.delete`, publishedId: docId, variantId, bundleId: r.bundle},
      )
    }
    const actions: Action[] = rows
      .filter((r) => r.bundle !== 'published' && r.bundle !== 'drafts')
      .map((r) => ({actionType: `${A}.version.discard`, versionId: r._id}))
    const draft = find(rows, 'drafts')
    if (find(rows, 'published')) {
      actions.push({actionType: `${A}.delete`, publishedId: docId, ...(draft ? {includeDrafts: [draft._id]} : {})})
    } else if (draft) {
      actions.push({actionType: `${A}.discard`, draftId: draft._id})
    }
    return actions
  }

  if (op === 'create') {
    if (rows.length) throw new Error('Already has a version.')
    if (!variantId) throw new Error('Only variants are created here.')
    return [{actionType: `${A}.variant.create`, publishedId: docId, variantId, bundleId: where, document: await baseContent(client, docId)}]
  }

  // addToRelease: copy the row's content into the release.
  if (!rows.length) throw new Error('Nothing to add: the row has no version.')
  if (where === 'drafts') throw new Error('Pick a release.')
  if (rows.some((r) => r.bundle === where)) throw new Error('Already in this release.')
  const source = find(rows, 'drafts') ?? find(rows, 'published') ?? rows[0]
  const content = await baseContent(client, docId, source)
  return variantId
    ? [{actionType: `${A}.variant.create`, publishedId: docId, variantId, bundleId: where, document: content}]
    : [{actionType: `${A}.version.create`, publishedId: docId, document: {...content, _id: `versions.${where}.${docId}`}}]
}

/** Run an op over many targets, one at a time; report per row. */
export async function runOp(
  client: SanityClient,
  op: Op,
  targets: readonly Target[],
  where: string,
  onResult?: (result: RowResult) => void,
): Promise<RowResult[]> {
  const results: RowResult[] = []
  for (const target of targets) {
    let result: RowResult
    try {
      const actions = await buildActions(client, op, target, where)
      await client.action(actions as never, {tag: `variants-2-0.c5.${op}`})
      result = {docId: target.docId, ok: true, message: 'Done'}
    } catch (e) {
      result = {docId: target.docId, ok: false, message: errorText(e)}
    }
    results.push(result)
    onResult?.(result)
  }
  return results
}
