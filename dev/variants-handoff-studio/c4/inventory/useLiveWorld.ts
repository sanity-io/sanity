import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useActiveReleases} from 'sanity'

import {type SystemVariant} from '../../../../packages/sanity/src/core/variants/types'
import {useDimensions, useVariantDefinitions} from '../../c1/world'
import {useVersionList} from '../../data/useVersionList'
import {type InventoryEntry, type InventoryWorld} from './fixtures'

/** `3h ago`, `2d ago`, `1w ago`, `1mo ago`: the format Andrej's model parses (`ageInHours`). */
function relative(iso: string | undefined): string {
  if (!iso) return '0h ago'
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (hours < 24) return `${Math.floor(hours)}h ago`
  const days = hours / 24
  if (days < 7) return `${Math.floor(days)}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

/**
 * LIVE: builds Andrej's `InventoryWorld` from the dataset instead of his mock "Lisbon guide": the document's versions
 * (`useVersionList`), the real releases (`useActiveReleases`), the variant definitions and the dimensions the studio
 * shows (the Stage setting applies). `null` while the versions load.
 */
export function useLiveWorld(documentId: string, title: string): InventoryWorld | null {
  const versions = useVersionList(documentId)
  const {data: releases} = useActiveReleases()
  const variants = useVariantDefinitions()
  const dimensions = useDimensions()

  return useMemo(() => {
    if (!versions) return null
    const entries: InventoryEntry[] = versions.map((v) => ({
      key: `${v.bundleId ?? 'published'}:${v.variantId ?? 'base'}`,
      group: v.bundleId ?? 'published',
      variantId: v.variantId,
      // Which fields differ is not computed yet.
      changedFields: [],
      updated: relative(v.updatedAt),
    }))
    return {
      // The model finds a release by `name`; make sure every live release carries one (its id after `_.releases.`).
      releases: (releases ?? []).map((r) => ({
        ...r,
        name: r.name ?? r._id.replace(/^_\.releases\./, ''),
      })) as ReleaseDocument[],
      entries,
      variants: variants as unknown as SystemVariant[],
      dimensions: dimensions.map((d) => ({
        name: d.name,
        title: d.title,
        values: d.values.map(([value, valueTitle]) => ({value, title: valueTitle})),
      })),
      document: {id: documentId, title},
      content: {base: {title}},
    }
  }, [versions, releases, variants, dimensions, documentId, title])
}
