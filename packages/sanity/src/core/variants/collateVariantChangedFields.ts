import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'

import {type PerspectiveBundle} from '../perspective/types'
import {type EditStateFor} from '../store/document/document-pair/editState'

/**
 * Keys that describe a document's identity or revision rather than its content. A variant is a
 * separate document, so it always differs from its base on these — they can never carry an
 * audience-specific difference. Filtered defensively: a schema is not expected to declare them.
 */
const SYSTEM_FIELDS: ReadonlySet<string> = new Set([
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
  '_key',
  '_weak',
  '_originalId',
])

const EMPTY_SET: ReadonlySet<string> = new Set<string>()

/**
 * The Default-audience document a variant is compared against, for the bundle currently being
 * viewed. "The base" is always whatever an editor looking at the Default audience would see in
 * this same perspective — that equivalence is what makes the indicator legible.
 *
 * `baseEditState` describes the **base** pair (`draft`/`published`) plus, when a release id was
 * requested, the base's release version in `version`. It never holds the variant: variant
 * documents ride the version slot of their own pair.
 *
 * @internal
 */
export function selectVariantBaseDocument(
  baseEditState: EditStateFor,
  bundle: PerspectiveBundle,
): SanityDocument | null {
  // Viewing published content: the difference worth surfacing is against what the Default audience
  // is actually being served, so an unpublished base draft is not a candidate.
  if (bundle === 'published') {
    return baseEditState.published
  }

  // Drafts, or a release. `version` is populated only when a release id was requested, so the same
  // expression covers both: prefer Default as it will look when the release ships, then fall back
  // to the ambient Default for documents the release does not touch.
  return baseEditState.version ?? baseEditState.draft ?? baseEditState.published
}

/**
 * The names of the top-level schema fields whose value in `variantDocument` differs from
 * `baseDocument`.
 *
 * A variant is an independent copy with no live link back to its base, and comparing it to the base
 * anyway is precisely the useful thing: the answer is recomputed whenever **either** side changes,
 * so the mark always means "this field differs from Default right now".
 *
 * Granularity is deliberately top-level, matching revert and the review-changes diff so the three
 * surfaces never disagree. Customising one paragraph therefore marks the whole `body` field.
 *
 * @internal
 */
export function collateVariantChangedFields({
  variantDocument,
  baseDocument,
  schemaType,
}: {
  variantDocument: SanityDocument | null
  baseDocument: SanityDocument | null
  schemaType: ObjectSchemaType
}): ReadonlySet<string> {
  // No variant document at the location this perspective resolves to. The form is showing the
  // create-variant affordance or an empty read-only document, and marking every field there would
  // be noise.
  if (!variantDocument) {
    return EMPTY_SET
  }

  const changedFields = new Set<string>()

  for (const field of schemaType.fields) {
    if (SYSTEM_FIELDS.has(field.name)) {
      continue
    }

    // A variant with no base at all: there is nothing to be equal to, so any value it holds is
    // audience-specific by definition. An empty string, `0`, `false` and `[]` all count.
    if (!baseDocument) {
      const value = variantDocument[field.name]

      if (typeof value !== 'undefined' && value !== null) {
        changedFields.add(field.name)
      }

      continue
    }

    if (!isEqual(baseDocument[field.name], variantDocument[field.name])) {
      changedFields.add(field.name)
    }
  }

  return changedFields
}
