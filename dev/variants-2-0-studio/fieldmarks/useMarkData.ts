import {useEffect, useMemo, useSyncExternalStore} from 'react'
import {useClient, useFormValue} from 'sanity'
import {useRouter} from 'sanity/router'

import  {type Json} from './markModel'

// The documents the E9 marks compare against, fetched once per document and variant and shared by every field of the form
// (a field override runs once per field; this keeps it to one query). Raw perspective, API version X, like the C9 candidates.
//  - `published`: the published document at the SAME address as the pane (the variant's published version, or the base's published document)
//  - `base`: the base's published document, only while a variant is in view
// Both are null while loading and when there is nothing to compare with.

export interface MarkData {
  current: Json
  published: Json | null
  base: Json | null
  variantId: string | null
  baseId: string | null
  ready: boolean
}

interface Entry {
  published: Json | null
  base: Json | null
  at: number
  loading: boolean
  ready: boolean
}

const entries = new Map<string, Entry>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}
const EMPTY: Entry = {published: null, base: null, at: 0, loading: false, ready: false}
const STALE_MS = 6000

export const baseIdOf = (id: string) => id.replace(/^(drafts\.|versions\.[^.]+\.)/, '')

export function useMarkData(): MarkData {
  const id = useFormValue(['_id']) as string | undefined
  const current = useFormValue([]) as Json
  const base0 = useClient({apiVersion: 'X'})
  const client = useMemo(
    () => base0.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [base0],
  )
  const router = useRouter()
  const variantId =
    typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : null
  const baseId = id ? baseIdOf(id) : null
  const key = baseId ? `${baseId}|${variantId ?? '-'}` : ''
  const entry = useSyncExternalStore(subscribe, () => (key ? (entries.get(key) ?? EMPTY) : EMPTY))

  useEffect(() => {
    if (!key || !baseId) return
    const known = entries.get(key)
    if (known?.loading || (known && Date.now() - known.at < STALE_MS)) return
    entries.set(key, {...(known ?? EMPTY), loading: true})
    const base = client.fetch('*[_id == $id][0]', {id: baseId}) as Promise<Json | null>
    const published = variantId
      ? (client.fetch(
          '*[_system.variant._ref == $vref && !defined(_system.bundleId) && _id match $pattern][0]',
          {vref: `_.variants.${variantId}`, pattern: `versions.*.${baseId}`},
        ) as Promise<Json | null>)
      : base
    void Promise.all([base, published])
      .then(([b, p]) =>
        entries.set(key, {
          base: variantId ? (b ?? null) : null,
          published: p ?? null,
          at: Date.now(),
          loading: false,
          ready: true,
        }),
      )
      .catch(() =>
        entries.set(key, {
          ...(entries.get(key) ?? EMPTY),
          at: Date.now(),
          loading: false,
          ready: true,
        }),
      )
      .finally(emit)
  }, [client, key, baseId, variantId])

  return {
    current,
    published: entry.published,
    base: entry.base,
    variantId,
    baseId,
    ready: entry.ready,
  }
}

/** Forget what was fetched (after a publish, so the next render compares with the new published version). */
export function refreshMarkData() {
  entries.clear()
  emit()
}
