import {createContext, type ReactNode, useContext} from 'react'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * An extension point on the navbar's perspective control (`ReleasesNav` and its `GlobalPerspectiveMenu`):
 * extra rows at the foot of the menu, and a suffix after the label. The Variants 2.0 C1 Option A puts
 * "Narrow by dimension…" in this menu and the chosen variant values next to "Drafts". Today the menu has no
 * slot for either.
 *
 * It is a hook, so the host can decide per render and read its own state. The default returns `undefined`,
 * so Studio is unchanged unless a provider is mounted.
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
}

/** @internal */
export type UsePerspectiveMenuExtension = () => PerspectiveMenuExtension | undefined

const noExtension: UsePerspectiveMenuExtension = () => undefined

const PerspectiveMenuExtensionContext = createContext<UsePerspectiveMenuExtension>(noExtension)

/** @internal Provide a hook (a stable function) that extends the perspective menu. */
export const PerspectiveMenuExtensionProvider = PerspectiveMenuExtensionContext.Provider

/** @internal */
export function usePerspectiveMenuExtension(): PerspectiveMenuExtension | undefined {
  // The context value is a stable hook supplied once by the host, so calling it keeps the hook order.
  const useExtension = useContext(PerspectiveMenuExtensionContext)
  return useExtension()
}
