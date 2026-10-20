import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {type Json} from '../fieldmarks/markModel'
import {
  type Address,
  closePath,
  type Comparison,
  NONE,
  openBesidePath,
  readComparison,
} from './address'

/** The global address, from the router's sticky params (what the Showing row shows). */
export function useGlobalAddress(): Address {
  const router = useRouter()
  const perspective = router.stickyParams.perspective
  const variant = router.stickyParams.variant
  return {
    perspective: typeof perspective === 'string' ? perspective : 'drafts',
    variant: typeof variant === 'string' ? variant : NONE,
  }
}

/** The comparison in the current URL, if any (re-read on every navigation). */
export function useComparison(): Comparison | null {
  const global = useGlobalAddress()
  const state = useRouterState((s) => s)
  // The router state changes before the address bar does, so the path is read after the navigation has landed.
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const read = () => setPath(window.location.pathname)
    read()
    const timer = window.setTimeout(read, 60)
    return () => window.clearTimeout(timer)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the router state is the trigger: the address bar is read after it changes
  }, [state])
  return readComparison(path, global)
}

/** Open the document beside the current one at an address, and close a comparison. Both are navigations, so a link reproduces them. */
export function useCompareActions() {
  const router = useRouter()
  const global = useGlobalAddress()
  return useMemo(
    () => ({
      openBeside(docId: string, address: Address) {
        const path = openBesidePath(window.location.pathname, docId, address, global)
        if (path) router.navigateUrl({path: path + window.location.search})
      },
      close() {
        const path = closePath(window.location.pathname, global)
        if (path) router.navigateUrl({path: path + window.location.search})
      },
      go(path: string) {
        router.navigateUrl({path: path + window.location.search})
      },
    }),
    [router, global],
  )
}

/** The document at an address (raw perspective, API version X): `doc` is null while loading or when there is no version there. */
export function useAddressDoc(docId: string, address: Address): {doc: Json | null; ready: boolean} {
  const base = useClient({apiVersion: 'X'})
  const client = useMemo(
    () => base.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [base],
  )
  const key = `${docId}|${address.perspective}|${address.variant}`
  const [state, setState] = useState<{key: string; doc: Json | null}>({key: '', doc: null})
  useEffect(() => {
    let cancelled = false
    const variant = address.variant === NONE ? null : address.variant
    const bundle = address.perspective
    const query = variant
      ? bundle === 'published'
        ? '*[_system.variant._ref == $vref && !defined(_system.bundleId) && _id match $pattern][0]'
        : '*[_system.variant._ref == $vref && _system.bundleId == $bundle && _id match $pattern][0]'
      : bundle === 'published'
        ? '*[_id == $id][0]'
        : bundle === 'drafts'
          ? 'coalesce(*[_id == "drafts." + $id][0], *[_id == $id][0])'
          : '*[_id == "versions." + $bundle + "." + $id][0]'
    void client
      .fetch(query, {
        id: docId,
        vref: `_.variants.${variant}`,
        bundle,
        pattern: `versions.*.${docId}`,
      })
      .then((doc) => !cancelled && setState({key, doc: (doc as Json) ?? null}))
      .catch(() => !cancelled && setState({key, doc: null}))
    return () => {
      cancelled = true
    }
  }, [client, key, docId, address.perspective, address.variant])
  return {doc: state.key === key ? state.doc : null, ready: state.key === key}
}
