import {createContext, type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {useActiveReleases, usePerspective, useSetPerspective} from 'sanity'

import {type Chosen, type DimensionSpec, valueTitle} from './model'
import {useDimensions} from './world'

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
  const [chosen, setChosen] = useState<Chosen>({})
  const [rowShown, setRowShown] = useState(false)
  const [pending, setPending] = useState(false)

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
