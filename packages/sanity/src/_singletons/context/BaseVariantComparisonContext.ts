import {createContext} from 'react'

/**
 * The slot of the base version the field marks compare with: `'published'`, `'drafts'`, or a
 * release id. Set by the form builder from the compared document, so the mark's tooltip names the version actually compared (which can be
 * a fallback, not the slot in view). Undefined when there is no comparison.
 * @internal
 */
export const BaseVariantComparisonContext = createContext<string | undefined>(undefined)
