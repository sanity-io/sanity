import {type ReactNode, useContext} from 'react'
import {PerspectiveMenuExtensionContext} from 'sanity/_singletons'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * An extension point on the navbar's perspective control (`ReleasesNav` and its `GlobalPerspectiveMenu`):
 * extra rows at the foot of the menu, a suffix after the label, and a search field for a long menu. The Variants 2.0 C1 Option A puts
 * "Narrow by dimension…" in this menu and the chosen variant values next to "Drafts". Today the menu has no
 * slot for either.
 *
 * It is a value, so the host can decide per render from its own state (it calls its own hook and provides the result).
 * The default is `undefined`, so Studio is unchanged unless a provider is mounted.
 *
 * @internal
 */
export interface PerspectiveMenuExtension {
  /** Menu items rendered in their own group under the releases list. */
  extraRows?: ReactNode
  /** Rendered right after the perspective label in the pill. */
  labelSuffix?: ReactNode
  /**
   * Makes the label (and its suffix) one clickable control. The chevron keeps opening the menu. On a release
   * perspective the label is normally a link to that release; while this is set the click goes here instead.
   */
  onLabelClick?: () => void
  /** `aria-expanded` of the label control, when it toggles something. */
  labelExpanded?: boolean
  labelTitle?: string
  /**
   * A search field at the top of the menu, shown only when the menu holds MORE than `above` entries (Published, Drafts and
   * the releases; not the footer actions). It filters those entries by their label. The host supplies the words, so Studio
   * carries no new strings: `placeholder` for the field and `empty` for when nothing matches.
   */
  search?: {
    above: number
    placeholder: string
    empty: (query: string) => ReactNode
  }
}

/** @internal Provide what extends the perspective menu: a value the host computes with its own hooks (`undefined` adds nothing). */
export const PerspectiveMenuExtensionProvider = PerspectiveMenuExtensionContext.Provider

/** @internal */
export function usePerspectiveMenuExtension(): PerspectiveMenuExtension | undefined {
  return useContext(PerspectiveMenuExtensionContext)
}
