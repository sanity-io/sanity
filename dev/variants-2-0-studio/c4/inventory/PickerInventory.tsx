import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useId, useMemo} from 'react'
import {getPublishedId, useDocumentVersions, type VersionInfoDocumentStub} from 'sanity'
import {type DocumentVersionPickerProps} from 'sanity/structure'

import {type InventoryEntry} from './fixtures'
import {InventoryConceptsProvider} from './model'
import {useLiveWorld} from './useLiveWorld'
import {VersionInventoryPanel} from './VersionInventoryPanel'

/**
 * What a picker leaves out of Andrej's panel (his files are not edited, so a scoped style hides it): everything the inspector hides (see HIDDEN in
 * LiveInventory.tsx) except search, plus the selection checkboxes and the bulk bar. A picker picks one version; it does not create or act on many.
 * Search stays: Compare versions' own picker had a filter field, and the panel's search narrows the same list.
 */
const pickerStyle = (scope: string) =>
  [
    'inventory-header',
    'inventory-filter-toggle',
    'inventory-filter-bar',
    'inventory-sort-menu',
    'inventory-view-settings',
    'inventory-view-menu',
    'inventory-footer',
    'inventory-create-action',
    'inventory-bulk-bar',
    // "Editing" and "Served" speak of the navbar's perspective; in Compare versions the highlighted row is simply what this side shows.
    'inventory-editing-label',
    'inventory-served-label-target',
  ]
    .map((id) => `${scope} [data-testid="${id}"]`)
    .join(', ')
    .concat(' {display: none !important}')
    .concat(` ${scope} .inventory-checkbox {display: none !important}`)

/** A version stub's row key in the inventory (`<bundle>:<variant>`), the same rule `toVersions` uses for the live world. */
function entryKey(publishedId: string, stub: VersionInfoDocumentStub) {
  const variantId = stub._system?.variant?._ref?.replace(/^_\.variants\./, '')
  let bundle: string
  if (stub._id === publishedId) bundle = 'published'
  else if (stub._id === `drafts.${publishedId}`) bundle = 'drafts'
  else if (variantId) bundle = stub._system?.bundleId ?? 'published'
  else bundle = stub._id.split('.')[1] ?? 'published'
  return `${bundle}:${variantId ?? 'base'}`
}

/**
 * T4 in Compare versions (Faheem, 23 Oct): each side's picker lists the document's versions with the Versions inspector's inventory, By publish
 * date, so a document's versions read the same in both places. Picking a row shows that version on this side; the version the other side shows is
 * greyed and cannot be picked. Nothing here changes the global perspective.
 */
export function PickerInventory({
  documentId,
  selectedId,
  otherId,
  onSelect,
}: DocumentVersionPickerProps) {
  // Each picker scopes its style to itself: both sides' pickers can be mounted at once, and one side's greyed row is not the other's.
  const pickerId = useId().replace(/:/g, '')
  const scope = `[data-version-picker="${pickerId}"]`
  const publishedId = getPublishedId(documentId)
  const world = useLiveWorld(publishedId, '')
  const {versions} = useDocumentVersions({documentId: publishedId})

  // Row key to document id, from the same versions the core picker reads.
  const idByKey = useMemo(
    () => new Map(versions.map((stub) => [entryKey(publishedId, stub), stub._id])),
    [versions, publishedId],
  )
  const keyOf = useCallback(
    (id: string | undefined) => {
      if (!id) return undefined
      for (const [key, value] of idByKey) if (value === id) return key
      return undefined
    },
    [idByKey],
  )

  const currentEntryKey = keyOf(selectedId)
  const otherKey = keyOf(otherId)
  const selection = useMemo(
    () => ({
      currentEntryKey,
      onSelect: (entry: InventoryEntry) => {
        const id = idByKey.get(entry.key)
        if (id && entry.key !== otherKey) onSelect(id)
      },
    }),
    [currentEntryKey, idByKey, onSelect, otherKey],
  )

  return (
    <Flex
      data-testid="compare-version-picker"
      data-version-picker={pickerId}
      direction="column"
      style={{width: 'min(440px, calc(100vw - 32px))', height: 'min(520px, 70vh)'}}
    >
      <style>
        {pickerStyle(scope)}
        {otherKey
          ? ` ${scope} [data-testid="inventory-row-${otherKey}"] {opacity: 0.5; pointer-events: none}`
          : ''}
      </style>
      {world ? (
        <Box flex={1} style={{minHeight: 0}}>
          <InventoryConceptsProvider initialView="publishDate" selection={selection} world={world}>
            <VersionInventoryPanel />
          </InventoryConceptsProvider>
        </Box>
      ) : (
        <Card padding={3}>
          <Text muted size={1}>
            Loading versions…
          </Text>
        </Card>
      )}
    </Flex>
  )
}
