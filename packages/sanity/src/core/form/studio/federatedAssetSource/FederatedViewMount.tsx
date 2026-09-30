import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {loadFederatedAssetSourceModule} from './loadModule'
import {
  type FederatedAssetSourceModule,
  type FederatedAssetSourceView,
  type FederatedAssetSourceViewHandle,
  type FederatedAssetSourceViewProps,
} from './types'

/**
 * Loads a brokered federated view module and mounts it. The artifact owns a
 * private React root under the mount element; calling `render()` again with
 * the same root updates the mounted view's props in place, so prop changes
 * re-apply without a remount. Load failures and synchronous `render()` throws
 * both report through `onUnavailable` — the dialog decides the recovery.
 *
 * @internal
 */
export function FederatedViewMount(props: {
  onUnavailable: (reason: unknown) => void
  view: FederatedAssetSourceView
  viewProps: FederatedAssetSourceViewProps
}): ReactNode {
  const {onUnavailable, view, viewProps} = props

  const [module, setModule] = useState<FederatedAssetSourceModule | null>(null)
  const [mountElement, setMountElement] = useState<HTMLDivElement | null>(null)
  const handleRef = useRef<FederatedAssetSourceViewHandle | null>(null)

  // Latest values for effects that must not re-run when they change (the
  // mount effect would tear the view's React root down and up again).
  const viewPropsRef = useRef(viewProps)
  const onUnavailableRef = useRef(onUnavailable)
  useEffect(() => {
    viewPropsRef.current = viewProps
    onUnavailableRef.current = onUnavailable
  })

  const fail = useCallback((error: unknown) => {
    console.warn('[sanity] Federated asset-source view unavailable:', error)
    onUnavailableRef.current(error)
  }, [])

  // Load the view module (cached across dialog opens).
  useEffect(() => {
    let cancelled = false
    loadFederatedAssetSourceModule(view)
      .then((loaded) => {
        if (!cancelled) setModule(loaded)
      })
      .catch((error) => {
        if (!cancelled) fail(error)
      })
    return () => {
      cancelled = true
    }
  }, [view, fail])

  // Mount the view. A synchronous throw from `render()` must not take the
  // Studio down.
  useEffect(() => {
    if (!module || !mountElement) return undefined
    try {
      handleRef.current = module.render(mountElement, viewPropsRef.current)
    } catch (error) {
      fail(error)
      return undefined
    }
    return () => {
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [module, mountElement, fail])

  // Re-apply changed props to the mounted view.
  useEffect(() => {
    if (module && mountElement && handleRef.current) {
      try {
        module.render(mountElement, viewProps)
      } catch (error) {
        fail(error)
      }
    }
  }, [module, mountElement, viewProps, fail])

  return (
    <>
      {module === null && <LoadingBlock showText />}
      <div ref={setMountElement} style={{flex: 1, overflow: 'auto'}} />
    </>
  )
}
