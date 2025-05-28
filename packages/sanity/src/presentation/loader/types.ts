import {type SanityDocument} from 'sanity'

/** @internal */
export type PresentationDisplayedDocumentContextValue = (
  displayed: Partial<SanityDocument> | null | undefined,
) => void
