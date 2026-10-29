import {type Reference} from '@sanity/types'
import {type ReactNode, Suspense, use, useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {NEVER, type Observable} from 'rxjs'

interface Props<AssetDoc> {
  reference: Reference
  observeAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
  waitPlaceholder?: ReactNode
}

function ReferencedAsset<Asset>(props: {
  promise: ObservablePromise<Asset>
  children: (assetDocument: Asset) => ReactNode
  waitPlaceholder?: ReactNode
}) {
  const asset = use(props.promise)
  // observeAsset implementations built on observePaths emit null while the
  // referenced document is missing or not yet indexed. Keep the placeholder
  // up for falsy emissions (matching the pre-Suspense behavior) — a later
  // emission with the real asset swaps the content in.
  return <>{asset ? props.children(asset) : props.waitPlaceholder}</>
}

export function WithReferencedAsset<Asset>(props: Props<Asset>) {
  const {reference, children, observeAsset, waitPlaceholder} = props
  const documentId = reference?._ref
  // Never invoke `observeAsset` without an id: some implementations parse the
  // id synchronously at call time and would throw during render.
  const observable = useMemo(
    () => (documentId ? observeAsset(documentId) : NEVER),
    [documentId, observeAsset],
  )
  // The promise is keyed to the observable identity (and thereby `documentId`),
  // so when the reference changes `children` never receives the previous
  // document's asset — the boundary suspends into `waitPlaceholder` until the
  // new asset arrives.
  const promise = useObservablePromise(observable, {disabled: !documentId})
  if (!documentId) {
    return <>{waitPlaceholder}</>
  }
  return (
    <Suspense fallback={waitPlaceholder}>
      <ReferencedAsset promise={promise} waitPlaceholder={waitPlaceholder}>
        {children}
      </ReferencedAsset>
    </Suspense>
  )
}
