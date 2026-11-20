import {type ReferringDocuments} from './useReferringDocuments'

/**
 * What the links to a document mean for deleting or unpublishing it:
 *
 * - `required`: at least one document holds a strong reference to it. Content Lake refuses the
 *   delete (and the unpublish) until that link is removed, so the dialog offers no confirm button.
 * - `optional`: every link is known to be weak. The delete goes through and the links point at
 *   nothing, so the dialog says that and offers a plain confirm button.
 * - `unknown`: the strength could not be read for every link (the read failed, the list is longer
 *   than what was fetched, or other datasets link to it). The dialog keeps its cautious copy.
 *
 * @internal
 */
export type LinkStrength = 'required' | 'optional' | 'unknown'

/** @internal */
export function getLinkStrength({
  internalReferences,
  crossDatasetReferences,
}: Pick<ReferringDocuments, 'internalReferences' | 'crossDatasetReferences'>): LinkStrength {
  const references = internalReferences?.references ?? []
  if (references.some((reference) => reference.required === true)) {
    return 'required'
  }
  const everyLinkKnownOptional =
    references.length > 0 &&
    references.length === internalReferences?.totalCount &&
    references.every((reference) => reference.required === false) &&
    (crossDatasetReferences?.totalCount ?? 0) === 0
  return everyLinkKnownOptional ? 'optional' : 'unknown'
}
