// LIVE replacement for Andrej's `inventory-concepts/fixtures.ts` (Storybook explorations/variants-2-0 @ db53306896).
// His file builds a mock "Lisbon guide" world; here the types and the helpers the panel and model import are kept, and
// the world comes from the dataset (see ./useLiveWorld.ts). Nothing in this file is mock data.
import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument} from 'sanity'

import {VARIANT_DOCUMENTS_PATH} from '../../../../packages/sanity/src/core/variants/store/constants'
import {type SystemVariant} from '../../../../packages/sanity/src/core/variants/types'

/** "Now" for the relative-date maths, fixed when the module loads. */
export const FIXTURE_NOW = new Date().toISOString()

export type DimensionName = string
export type Visitor = Partial<Record<DimensionName, string>>
export const defaultVisitor: Visitor = {}

/** Where a version sits: `drafts`, a release id, or `published`. */
export type InventoryGroupId = string

export type WorkflowStage = 'draft' | 'inReview' | 'approved'

/** One row of the inventory: one stored version of the open document. */
export interface InventoryEntry {
  key: string
  group: InventoryGroupId
  /** Short variant id, or `undefined` for the base document (all visitors). */
  variantId: string | undefined
  changedFields: string[]
  /** Relative time as the row shows it: `3h ago`, `2d ago`, `1w ago`, `1mo ago`. */
  updated: string
  stage?: WorkflowStage
  editedBy?: string[]
  assignee?: string
}

/** Live data has no workflow people yet: the "edited by" and "assignee" filters list none. */
export const ME = 'me'
export const PEOPLE: readonly {id: string; name: string}[] = []

export interface InventoryDimension {
  name: DimensionName
  title: string
  values: readonly {value: string; title: string}[]
}

export interface InventoryWorld {
  releases: ReleaseDocument[]
  entries: InventoryEntry[]
  features?: {releases?: boolean; variants?: boolean}
  variants?: SystemVariant[]
  dimensions?: readonly InventoryDimension[]
  document?: {id: string; title: string}
  content?: Record<string, Record<string, unknown>>
  fields?: Record<string, unknown>
  related?: InventoryWorld[]
  /** C4 E (approved by Faheem, 22 Oct): By publish date lists the drafts, as a group under Published. Unset, his views as built. */
  draftsInTimeline?: boolean
}

export const baseWorld: InventoryWorld = {
  releases: [],
  entries: [],
  variants: [],
  dimensions: [],
  document: {id: '', title: ''},
}

export const releasesOn = (world: InventoryWorld) => world.features?.releases !== false
export const variantsOn = (world: InventoryWorld) => world.features?.variants !== false
export const worldVariants = (world: InventoryWorld) => world.variants ?? []
export const worldDimensions = (world: InventoryWorld): readonly InventoryDimension[] =>
  world.dimensions ?? []
export const worldDocument = (world: InventoryWorld) => world.document ?? {id: '', title: ''}

/** The document id a row's version is stored under. */
export function documentIdFor(entry: InventoryEntry, documentId: string): string {
  if (!entry.variantId) return entry.group === 'drafts' ? `drafts.${documentId}` : documentId
  return `versions.${scopeIdFor(entry)}.${documentId}`
}

function scopeIdFor(entry: InventoryEntry): string {
  return `s${entry.group.replace(/^r/, '')}-${entry.variantId}`
}

function documentFor(entry: InventoryEntry, world: InventoryWorld): SanityDocument {
  const isRelease = entry.group !== 'drafts' && entry.group !== 'published'
  const {id: documentId} = worldDocument(world)
  const contents = world.content ?? {}
  const content = contents[entry.variantId ?? 'base'] ?? contents.base ?? {}
  return {
    _id: documentIdFor(entry, documentId),
    _type: 'book',
    _rev: `rev-${entry.key}`,
    _createdAt: FIXTURE_NOW,
    _updatedAt: FIXTURE_NOW,
    _system: {
      group: {_ref: documentId, _weak: true},
      ...(entry.group === 'published' ? {} : {bundleId: entry.group}),
      ...(isRelease ? {release: {_ref: `_.releases.${entry.group}`, _weak: true}} : {}),
      ...(entry.variantId
        ? {
            variant: {_ref: `${VARIANT_DOCUMENTS_PATH}.${entry.variantId}`, _weak: true},
            scopeId: scopeIdFor(entry),
          }
        : {}),
    },
    ...content,
    ...world.fields,
  } as SanityDocument
}

/** One document per inventory row, carrying the `_system` fields Studio resolves a target from. */
export function documentsFor(
  entries: InventoryEntry[],
  world: InventoryWorld = baseWorld,
): SanityDocument[] {
  return entries.map((entry) => documentFor(entry, world))
}
