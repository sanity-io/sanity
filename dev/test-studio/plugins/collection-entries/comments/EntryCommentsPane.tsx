import {useCommentThreads, useDocument} from '@sanity/sdk-react'
import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'

import {ENTRY_TYPE, COLLECTION_TYPE} from '../constants'
import {CommentThreadRow} from './CommentThreadRow'
import {LoadBoundary} from './LoadBoundary'

type EntryReference = {
  _key: string
  _ref?: string
}

// The form and this column are separate React trees, so inline entries register their root element here.
const inlineEntries = new Map<string, HTMLElement>()

export function registerInlineEntry(entryId: string, element: HTMLElement | null) {
  if (element === null) return undefined

  inlineEntries.set(entryId, element)
  return () => {
    if (inlineEntries.get(entryId) === element) inlineEntries.delete(entryId)
  }
}

function focusInlineEntry(entryId: string, fieldPath: string) {
  const entry = inlineEntries.get(entryId)
  const fieldName = CSS.escape(fieldPath.split(/[.[]/)[0] ?? '')

  entry?.scrollIntoView({block: 'center', behavior: 'smooth'})
  entry
    ?.querySelector<HTMLElement>(
      `[data-entry-field="${fieldName}"] :is(input, textarea, [contenteditable="true"])`,
    )
    ?.focus({preventScroll: true})
}

interface EntryCommentsPaneProps {
  collectionId: string
  onOpenEntry: (entryId: string, commentId: string) => void
}

export function EntryCommentsPane({collectionId, onOpenEntry}: EntryCommentsPaneProps) {
  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <Card borderBottom padding={3}>
        <Text as="h2" size={1} weight="medium">
          Entry comments
        </Text>
      </Card>
      <Card flex={1} overflow="auto" padding={3}>
        <LoadBoundary
          loading={<Spinner muted />}
          failed={<ErrorNotice message="The collection's entries could not be loaded." />}
        >
          <EntrySections collectionId={collectionId} onOpenEntry={onOpenEntry} />
        </LoadBoundary>
      </Card>
    </Flex>
  )
}

function EntrySections({collectionId, onOpenEntry}: EntryCommentsPaneProps) {
  const {data: entries} = useDocument<EntryReference[]>({
    documentId: collectionId,
    documentType: COLLECTION_TYPE,
    path: 'entries',
  })
  const entryIds = [
    ...new Set((entries ?? []).flatMap((item) => (item._ref === undefined ? [] : [item._ref]))),
  ]

  return entryIds.length === 0 ? (
    <Text muted size={1}>
      This collection has no entries yet.
    </Text>
  ) : (
    <Stack gap={3}>
      {entryIds.map((entryId, index) => (
        <LoadBoundary
          key={entryId}
          loading={<Spinner muted />}
          failed={<ErrorNotice message={`Comments on entry ${index + 1} could not be loaded.`} />}
        >
          <EntrySection entryId={entryId} position={index + 1} onOpenEntry={onOpenEntry} />
        </LoadBoundary>
      ))}
    </Stack>
  )
}

interface EntrySectionProps {
  entryId: string
  position: number
  onOpenEntry: (entryId: string, commentId: string) => void
}

function EntrySection({entryId, position, onOpenEntry}: EntrySectionProps) {
  const entryHandle = {documentId: entryId, documentType: ENTRY_TYPE}
  const {data: title} = useDocument<string>({...entryHandle, path: 'title'})
  const {threads} = useCommentThreads({...entryHandle, status: 'open'})

  return (
    <Card border radius={2}>
      <Box padding={3}>
        <Text size={1} weight="semibold" textOverflow="ellipsis">
          {position}. {title || 'Untitled entry'}
        </Text>
      </Box>
      {threads.length === 0 ? (
        <Card borderTop padding={3}>
          <Text muted size={1}>
            No open comments
          </Text>
        </Card>
      ) : (
        threads.map((thread) => (
          <CommentThreadRow
            key={thread.threadId}
            thread={thread}
            onSelect={() => focusInlineEntry(entryId, thread.fieldPath)}
            onOpenEntry={() => onOpenEntry(entryId, thread.parentComment.id)}
          />
        ))
      )}
    </Card>
  )
}

function ErrorNotice({message}: {message: string}) {
  return (
    <Card radius={2} padding={3} tone="critical">
      <Text size={1}>{message}</Text>
    </Card>
  )
}
