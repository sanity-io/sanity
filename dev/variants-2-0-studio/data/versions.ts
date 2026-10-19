// Turns the raw documents of one document group into the list of versions the C3 parts draw.
// Pure (no React, no Studio imports) so it can be checked against the live dataset from a script.
//
// Data model, as written by the Studio's own actions (see core/variants/documents/getVariantVersionInfo.ts):
//   published              `<id>`
//   draft                  `drafts.<id>`
//   release version        `versions.<releaseId>.<id>`
//   variant version        `versions.<scopeId>.<id>` with `_system.variant` and `_system.bundleId`
//                          (`bundleId` absent = published, `drafts`, or a release id)

/** The Storybook C3 parts' `State`, plus `undecided` for a version in a release with no date or type yet. */
export type VersionState = 'published' | 'draft' | 'scheduled' | 'asap' | 'undecided'

export interface AudienceVersion {
  /** `null` is the base document. */
  audience: string | null
  state: VersionState
  /** The time of day of a scheduled version, such as `9:00 AM`. */
  at?: string
  /** The release title when the version is in a release. */
  release?: string | null
  /** Set when the release holds this one document (a scheduled draft). */
  scheduledDraft?: boolean
  createdMinutesAgo?: number
  updatedMinutesAgo?: number
}

export interface RawVersionRow {
  _id: string
  variant?: string | null
  bundle?: string | null
  _createdAt: string
  _updatedAt: string
}

export interface ReleaseInfo {
  id: string
  title?: string
  type?: 'asap' | 'scheduled' | 'undecided'
  state?: string
  at?: string | null
  cardinality?: 'one' | 'many' | null
}

/** GROQ for one document group's rows (raw perspective). Params: `$id`. */
export const VERSION_ROWS_GROQ = `*[_id in [$id, "drafts." + $id] || _system.group._ref == $id || _id match "versions.*." + $id]{
  _id, "variant": _system.variant._ref, "bundle": _system.bundleId, _createdAt, _updatedAt
}`

export const DEFINITIONS_GROQ = `*[_type == "system.variant"]{"id": string::split(_id, ".")[2], "title": coalesce(metadata.title, string::split(_id, ".")[2])}`
export const RELEASES_GROQ = `*[_type == "system.release"]{"id": string::split(_id, ".")[2], "title": metadata.title, "type": metadata.releaseType, state, "at": metadata.intendedPublishAt, "cardinality": metadata.cardinality}`

const minutesBetween = (now: Date, iso: string) => Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000))

function timeOfDay(iso: string, timeZone: string | undefined) {
  return new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute: '2-digit', timeZone}).format(new Date(iso))
}

export function toVersions(
  id: string,
  rows: readonly RawVersionRow[],
  options: {
    definitions: ReadonlyMap<string, string>
    releases: ReadonlyMap<string, ReleaseInfo>
    now?: Date
    timeZone?: string
  },
): AudienceVersion[] {
  const now = options.now ?? new Date()
  const out: AudienceVersion[] = []

  for (const row of rows) {
    const variantId = row.variant ? row.variant.replace(/^_\.variants\./, '') : null
    const audience = variantId ? (options.definitions.get(variantId) ?? variantId) : null
    const base = {
      audience,
      createdMinutesAgo: minutesBetween(now, row._createdAt),
      updatedMinutesAgo: minutesBetween(now, row._updatedAt),
    }

    // Which bundle holds this document: `published`, `drafts` or a release id.
    let bundle: string
    if (row._id === id) bundle = 'published'
    else if (row._id === `drafts.${id}`) bundle = 'drafts'
    else if (variantId) bundle = row.bundle ?? 'published'
    else bundle = row._id.split('.')[1] ?? 'published'

    if (bundle === 'published') out.push({...base, state: 'published'})
    else if (bundle === 'drafts') out.push({...base, state: 'draft'})
    else {
      const release = options.releases.get(bundle)
      // Versions in archived or published releases no longer represent anything live.
      if (!release || release.state === 'archived' || release.state === 'published') continue
      const state: VersionState = release.type === 'asap' ? 'asap' : release.type === 'scheduled' ? 'scheduled' : 'undecided'
      out.push({
        ...base,
        state,
        release: release.title ?? bundle,
        ...(release.cardinality === 'one' ? {scheduledDraft: true} : {}),
        ...(state === 'scheduled' && release.at ? {at: timeOfDay(release.at, options.timeZone)} : {}),
      })
    }
  }
  return out
}
