import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {DEFINITIONS_GROQ, RELEASES_GROQ, type ReleaseInfo} from '../data/versions'

/** One stored version of a document: base or variant, in published, drafts or a release. */
export interface VersionRow {
  /** The real document id, e.g. `drafts.book-x` or `versions.rFoo.book-x`. */
  _id: string
  docId: string
  /** The variant definition id, or null for the base document. */
  variantId: string | null
  /** `published`, `drafts` or a release id. */
  bundle: string
  updated: string
}

/** One row per document group, aggregated from every version document of it. */
export interface DocRow {
  id: string
  title: string
  type: string
  published: boolean
  draft: boolean
  /** Every version document of the group: base, variant, release. */
  versions: number
  /** Distinct variant definitions that have a document for this group. */
  variantIds: string[]
  /** Distinct releases that hold a version of this group. */
  releaseIds: string[]
  updated: string
  /** Every stored version, base and variant. */
  list: VersionRow[]
}

export interface Corpus {
  docs: DocRow[]
  releases: ReleaseInfo[]
  /** Versions per release: documents (base) and variants. */
  releaseCounts: Record<string, {docs: number; variants: number}>
  definitions: {id: string; title: string}[]
}

interface RawRow {
  _id: string
  _type: string
  title?: string
  _updatedAt: string
  variant?: string | null
  bundle?: string | null
}

const ROWS_GROQ = `*[_type in ["book", "bookLive"] || defined(_system.variant)]{
  _id, _type, title, _updatedAt, "variant": _system.variant._ref, "bundle": _system.bundleId
}`

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

export function buildCorpus(rows: readonly RawRow[], releases: ReleaseInfo[], definitions: {id: string; title: string}[]): Corpus {
  const groups = new Map<string, DocRow>()
  const releaseCounts: Record<string, {docs: number; variants: number}> = {}
  for (const source of rows) {
    // A base version in a release is `versions.<release>.<id>` and carries no `_system.bundleId`.
    const bundle = source.bundle ?? (source._id.startsWith('versions.') ? source._id.split('.')[1] : null)
    const row = {...source, bundle}
    const id = row._id.split('.').at(-1) as string
    let group = groups.get(id)
    if (!group) {
      group = {id, title: id, type: row._type, published: false, draft: false, versions: 0, variantIds: [], releaseIds: [], updated: '', list: []}
      groups.set(id, group)
    }
    group.versions += 1
    {
      const variantId = row.variant ? shortId(row.variant) : null
      const where = variantId
        ? (row.bundle ?? 'published')
        : row._id === id
          ? 'published'
          : row._id === `drafts.${id}`
            ? 'drafts'
            : (row.bundle ?? 'published')
      group.list.push({_id: row._id, docId: id, variantId, bundle: where, updated: row._updatedAt})
    }
    if (row.bundle && row.bundle !== 'drafts' && row.bundle !== 'published') {
      const counts = (releaseCounts[row.bundle] ??= {docs: 0, variants: 0})
      if (row.variant) counts.variants += 1
      else counts.docs += 1
    }
    const variant = row.variant ? shortId(row.variant) : null
    if (variant) {
      if (!group.variantIds.includes(variant)) group.variantIds.push(variant)
    } else {
      if (row._id === id) group.published = true
      else if (row._id === `drafts.${id}`) group.draft = true
      else if (row.bundle && !group.releaseIds.includes(row.bundle)) group.releaseIds.push(row.bundle)
      if (row.title && (row._id === id || group.title === id || row._id === `drafts.${id}`)) group.title = row.title
    }
    if (row.bundle && !variant && row.bundle !== 'drafts' && !group.releaseIds.includes(row.bundle)) group.releaseIds.push(row.bundle)
    if (row._updatedAt > group.updated) group.updated = row._updatedAt
  }
  return {docs: [...groups.values()].sort((a, b) => a.title.localeCompare(b.title)), releases, releaseCounts, definitions}
}

/** LIVE: every document group of the dataset with its versions, plus the releases and variant definitions. */
export function useCorpus(): Corpus | null {
  const studio = useClient({apiVersion: 'X'})
  const [corpus, setCorpus] = useState<Corpus | null>(null)

  useEffect(() => {
    const client = studio.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false})
    let cancelled = false
    const load = () =>
      Promise.all([client.fetch(ROWS_GROQ), client.fetch(RELEASES_GROQ), client.fetch(DEFINITIONS_GROQ)])
        .then(([rows, releases, definitions]) => {
          if (!cancelled) setCorpus(buildCorpus(rows, releases, definitions))
        })
        .catch(() => undefined)
    void load()
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      window.removeEventListener('focus', load)
    }
  }, [studio])

  return corpus
}
