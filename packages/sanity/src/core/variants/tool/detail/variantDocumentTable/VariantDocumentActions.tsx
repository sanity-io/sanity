// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {type DocumentInVariantGroup} from '../types'

/**
 * Per-row actions for a single document in a variant, opened from a trailing ⋯ button — the same
 * operations the bulk-selection toolbar would offer, so a row doesn't have to be selected first.
 * Mirrors the releases document table's per-row menu so the two read as one family.
 *
 * Renders nothing until the variant document actions are wired up (FH-113) — a menu of
 * permanently-disabled items has no affordance over no menu at all, so this is a no-op rather
 * than a stub UI. Wiring FH-113 restores the menu here (see git history for the prior
 * publish/add-to-release/unpublish/delete disabled menu) and in the bulk toolbar together.
 *
 * @internal
 */
export const VariantDocumentActions = memo(function VariantDocumentActions(_props: {
  row: DocumentInVariantGroup
  t: TFunction<'variants'>
}) {
  return null
})
