import {useCallback, useRef} from 'react'

/**
 * Hook that provides focus restoration when closing the asset source dialog.
 * Returns a ref for the menu button and a close handler that restores focus to it.
 *
 * @internal
 */
export function useAssetSourceFocusRestoration(assetSourceClose: () => void) {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleAssetSourceClosed = useCallback(() => {
    assetSourceClose()
    menuButtonRef.current?.focus()
  }, [assetSourceClose])

  return {menuButtonRef, handleAssetSourceClosed}
}
