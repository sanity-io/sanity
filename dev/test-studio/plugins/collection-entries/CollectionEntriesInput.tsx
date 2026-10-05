import {AddIcon} from '@sanity/icons/Add'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {LaunchIcon} from '@sanity/icons/Launch'
import {TrashIcon} from '@sanity/icons/Trash'
import {useCreateDocument} from '@sanity/sdk-react'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {uuid} from '@sanity/uuid'
import {Suspense, useState} from 'react'
import {type ArrayOfObjectsInputProps} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {registerInlineEntry} from './comments'
import {ENTRY_TYPE, COLLECTION_ENTRIES_ID_PREFIX} from './constants'
import {EntryEditor} from './EntryEditor'

type EntryFields = {
  title: string
}

function readEntryId(item: {_key: string}): string | undefined {
  return '_ref' in item && typeof item._ref === 'string' ? item._ref : undefined
}

// The Studio form owns only the collection's `entries` order; each entry renders inline from its own document.
export function CollectionEntriesInput(props: ArrayOfObjectsInputProps) {
  const {value = [], path, readOnly = false, onItemAppend, onItemMove, onItemRemove} = props
  const {handleEditReference} = usePaneRouter()
  const createEntry = useCreateDocument<EntryFields>({documentType: ENTRY_TYPE})
  const [isAddingEntry, setIsAddingEntry] = useState(false)

  async function handleAddEntry() {
    setIsAddingEntry(true)
    try {
      const entry = await createEntry(
        {title: ''},
        {documentId: `${COLLECTION_ENTRIES_ID_PREFIX}entry-${uuid()}`},
      )
      const reference = {
        _key: randomKey(12),
        _type: 'reference',
        _ref: entry.documentId,
        _weak: true,
      }
      onItemAppend(reference)
    } catch (error) {
      console.error('Failed to add a collection entry', error)
    }
    setIsAddingEntry(false)
  }

  return (
    <Stack gap={3}>
      {value.map((item, index) => {
        const entryId = readEntryId(item)
        return (
          <CollectionEntryItem
            key={item._key}
            entryId={entryId}
            position={index + 1}
            isFirst={index === 0}
            isLast={index === value.length - 1}
            readOnly={readOnly}
            onMoveUp={() => onItemMove({fromIndex: index, toIndex: index - 1})}
            onMoveDown={() => onItemMove({fromIndex: index, toIndex: index + 1})}
            onRemove={() => onItemRemove(item._key)}
            onOpen={
              entryId === undefined
                ? undefined
                : () =>
                    handleEditReference({
                      id: entryId,
                      type: ENTRY_TYPE,
                      parentRefPath: [...path, {_key: item._key}],
                      template: {id: ENTRY_TYPE},
                    })
            }
          />
        )
      })}
      <Button
        icon={AddIcon}
        mode="ghost"
        text="Add new entry"
        disabled={readOnly}
        loading={isAddingEntry}
        onClick={handleAddEntry}
      />
    </Stack>
  )
}

interface CollectionEntryItemProps {
  entryId: string | undefined
  position: number
  isFirst: boolean
  isLast: boolean
  readOnly: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onOpen: (() => void) | undefined
}

function CollectionEntryItem(props: CollectionEntryItemProps) {
  const {entryId, position, isFirst, isLast, readOnly, onMoveUp, onMoveDown, onRemove, onOpen} =
    props

  return (
    <Card
      ref={(element: HTMLDivElement | null) =>
        entryId === undefined ? undefined : registerInlineEntry(entryId, element)
      }
      border
      radius={2}
      padding={3}
      data-collection-entry-id={entryId}
    >
      <Stack gap={3}>
        <Flex align="center" gap={1}>
          <Box flex={1}>
            <Text size={1} weight="medium" muted>
              Entry {position}
            </Text>
          </Box>
          <Button
            icon={ArrowUpIcon}
            mode="bleed"
            aria-label="Move entry up"
            title="Move entry up"
            disabled={readOnly || isFirst}
            onClick={onMoveUp}
          />
          <Button
            icon={ArrowDownIcon}
            mode="bleed"
            aria-label="Move entry down"
            title="Move entry down"
            disabled={readOnly || isLast}
            onClick={onMoveDown}
          />
          <Button
            icon={LaunchIcon}
            mode="bleed"
            text="Open entry"
            disabled={onOpen === undefined}
            onClick={onOpen}
          />
          <Button
            icon={TrashIcon}
            mode="bleed"
            tone="critical"
            aria-label="Remove entry"
            title="Remove entry"
            disabled={readOnly}
            onClick={onRemove}
          />
        </Flex>
        {entryId === undefined ? (
          <Text muted size={1}>
            This item does not reference an entry.
          </Text>
        ) : (
          <Suspense fallback={<Spinner muted />}>
            <EntryEditor entryId={entryId} readOnly={readOnly} />
          </Suspense>
        )}
      </Stack>
    </Card>
  )
}
