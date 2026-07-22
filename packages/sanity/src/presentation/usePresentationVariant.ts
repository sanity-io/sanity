import {usePerspective} from 'sanity'

/**
 * The selected editing variant as a bare variant id (e.g. `Ab12cd34`), or `undefined` when no
 * variant is selected. This is the raw `variant` router sticky param value, available
 * synchronously — orthogonal to the perspective, and passed alongside it wherever the
 * perspective travels (iframe URL, comlink messages, loader fetches).
 * @internal
 */
export function usePresentationVariant(): string | undefined {
  const {selectedVariantName} = usePerspective()
  return selectedVariantName
}
