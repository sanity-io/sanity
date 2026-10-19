import {createContext, type ReactNode, useContext} from 'react'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * A slot in the Presentation preview header, left of the viewport toggle, for a control that sets the preview's
 * variant (the dimension control of the Variants 2.0 perspective design). The host provides a component; the
 * default renders nothing, so Studio is unchanged unless a provider is mounted.
 *
 * @internal
 */
export type PreviewHeaderExtensionComponent = () => ReactNode

const none: PreviewHeaderExtensionComponent = () => null

const PreviewHeaderExtensionContext = createContext<PreviewHeaderExtensionComponent>(none)

/** @internal Provide a (stable) component rendered in the preview header. */
export const PreviewHeaderExtensionProvider = PreviewHeaderExtensionContext.Provider

/** @internal */
export function PreviewHeaderExtension(): ReactNode {
  const Extension = useContext(PreviewHeaderExtensionContext)
  return <Extension />
}
