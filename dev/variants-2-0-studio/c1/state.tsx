import {createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useActiveReleases, usePerspective, useSetPerspective, useSetVariant} from 'sanity'
import {useRouterState} from 'sanity/router'

import {type Chosen, type DimensionSpec, valueTitle} from './model'
import {useDimensions, useVariantDefinitions} from './world'

/** The version: `drafts`, `published`, or a release id. */
export type VersionId = string

/**
 * LIVE replacement for the Storybook exploration's `PerspectiveProvider` (perspective/state.tsx @ 2700f4cf07).
 * The VERSION is the real Studio perspective (read with `usePerspective`, written with `useSetPerspective`), so the
 * stock pill and the row can never disagree. The variant values (`chosen`), the row and the pending chip are
 * design state kept here: with the Variants flag off, stock Studio has no variant address.
 */
export interface PerspectiveValue {
  version: VersionId
  setVersion: (version: VersionId) => void
  chosen: Chosen
  setChosen: (next: Chosen) => void
  /** The row (the composed address) is shown under the navbar. */
  rowShown: boolean
  setRowShown: (shown: boolean) => void
  /** A "Pick a dimension" chip is on the row: a dimension is being added. */
  pending: boolean
  setPending: (pending: boolean) => void
  dimensions: DimensionSpec[]
  /** "Drafts", "Published" or a release title. */
  versionLabel: string
  /** The values chosen, in dimension order: "Returning visitors", "en-GB". */
  valueTitles: string[]
}

const Ctx = createContext<PerspectiveValue | null>(null)

export function usePerspectiveState(): PerspectiveValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('PerspectiveProvider is missing')
  return value
}

const releaseName = (id: string) => id.replace(/^_\.releases\./, '')

export function PerspectiveProvider({children}: {children: ReactNode}) {
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const {data: releases} = useActiveReleases()
  const dimensions = useDimensions()
  const definitions = useVariantDefinitions()
  const {selectedVariantName} = usePerspective()
  const setVariantParam = useSetVariant()
  const tool = useRouterState((state) => state.tool as string | undefined)
  const [chosen, setChosen] = useState<Chosen>({})
  const [rowShown, setRowShown] = useState(false)
  const [pending, setPending] = useState(false)

  // The router's sticky `variant` param is the context that travels between tools (and survives a reload or a new tab).
  // When it names a definition the bar does not show yet, the bar takes that definition's values and opens its row, so
  // Presentation, Structure and the rest all show the same bar for the same context.
  useEffect(() => {
    if (!selectedVariantName) return
    const id = selectedVariantName.replace(/^_\.variants\./, '')
    const definition = definitions.find((v) => v._id.replace(/^_\.variants\./, '') === id)
    if (!definition) return
    const same = Object.keys(definition.conditions).length === Object.keys(chosen).length && Object.entries(definition.conditions).every(([k, v]) => chosen[k] === v)
    if (same) return
    setChosen({...definition.conditions})
    setRowShown(true)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- only a change of the param or the definitions re-reads it
  }, [selectedVariantName, definitions])

  // The other way: in Presentation the preview reads the router's variant param, so the bar's choice is written to it.
  // (Structure keeps reading the bar's own state; the param is the same context, shared by every tool.)
  useEffect(() => {
    if (tool !== 'presentation') return
    const entries = Object.entries(chosen)
    const exact = entries.length
      ? definitions.find((v) => {
          const own = Object.entries(v.conditions)
          return own.length === entries.length && own.every(([name, key]) => chosen[name] === key)
        })
      : undefined
    const wanted = exact?._id.replace(/^_\.variants\./, '')
    const current = selectedVariantName?.replace(/^_\.variants\./, '')
    if (entries.length && !exact) return
    if (wanted === current) return
    setVariantParam({variantId: exact?._id as never})
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- a change of the choice, the tool or the definitions
  }, [chosen, tool, definitions])

  const version: VersionId = selectedPerspectiveName ?? 'drafts'
  const setVersion = useCallback((next: VersionId) => setPerspective(next), [setPerspective])

  const versionLabel = useMemo(() => {
    if (version === 'drafts') return 'Drafts'
    if (version === 'published') return 'Published'
    return releases?.find((r) => releaseName(r._id) === version)?.metadata.title || version
  }, [version, releases])

  const value = useMemo<PerspectiveValue>(
    () => ({
      version,
      setVersion,
      chosen,
      setChosen,
      rowShown,
      setRowShown,
      pending,
      setPending,
      dimensions,
      versionLabel,
      valueTitles: dimensions.filter((d) => chosen[d.name]).map((d) => valueTitle(d, chosen[d.name])),
    }),
    [version, setVersion, chosen, rowShown, pending, dimensions, versionLabel],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
