import {type ReactNode, Suspense, useEffect} from 'react'

interface UpsellPanelBoundaryProps {
  /** Starts the upsell content request, which the provider does not preload */
  requestUpsellData: () => void
  /** Shown while the content request is pending */
  fallback: ReactNode
  children: ReactNode
}

/**
 * The boundary an upsell panel renders its content under when the provider does not preload it.
 * It commits first, so its effect starts the request, and then the children read the content with
 * `use()` and suspend to `fallback` until it arrives. A component that reads the promise must not
 * start the request itself: a suspended component never commits, so its effect would never run.
 *
 * @internal
 */
export function UpsellPanelBoundary({
  requestUpsellData,
  fallback,
  children,
}: UpsellPanelBoundaryProps) {
  useEffect(() => {
    requestUpsellData()
  }, [requestUpsellData])

  return <Suspense fallback={fallback}>{children}</Suspense>
}
