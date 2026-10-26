import {Stack, Text} from '@sanity/ui'

/**
 * The inventory of a document with no stored versions (from the Handoff Studio, 2602007cc8 and 3979467c4d; 26 Oct call, Pedro). A new document
 * is not stored until its first change, and a deleted one has nothing left, so the list was blank. The text says why, and what to do: a new
 * document is saved by its first change; a deleted one (core's `isDeleted`: no version left and not pristine) is restored, as the deleted banner
 * offers. Create version cannot help here: the base document is made by editing it.
 */
export function EmptyVersions({hasDrafts, isDeleted}: {hasDrafts: boolean; isDeleted: boolean}) {
  return (
    <Stack data-testid="inventory-empty" gap={2} padding={4}>
      <Text size={1} weight="medium">
        {isDeleted ? 'This document was deleted.' : 'No versions exist yet for this document.'}
      </Text>
      <Text muted size={1}>
        {isDeleted
          ? 'Restore it to bring its versions back.'
          : hasDrafts
            ? 'Make a change to save a draft.'
            : 'Make a change to save the document.'}
      </Text>
    </Stack>
  )
}
