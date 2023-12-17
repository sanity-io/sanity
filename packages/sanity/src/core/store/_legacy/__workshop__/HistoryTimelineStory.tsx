import {RestoreIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {Box, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {omit} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import {Button} from '../../../ui-components'
import {ChangeFieldWrapper} from '../../../changeIndicators'
import {
  ChangeList,
  Chunk,
  DocumentChangeContext,
  DocumentChangeContextInstance,
} from '../../../field'
import {useConnectionState, useEditState, useSchema} from '../../../hooks'
import {useInitialValue} from '../document'
import {useTimelineStore, useTimelineSelector} from '../history'

export default function HistoryTimelineStory() {
  const schema = useSchema()
  const documentId = useMemo(() => 'test', [])
  const documentType = useMemo(() => 'author', [])
  const schemaType = schema.get(documentType)
  const templateName = useMemo(() => undefined, [])
  const templateParams = useMemo(() => undefined, [])
  const [params, setParams] = useState<{rev?: string; since?: string}>({})

  const connectionState = useConnectionState(documentId, documentType)
  const editState = useEditState(documentId, documentType)

  const initialValue = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
  })

  const value: Partial<SanityDocument> =
    editState?.draft || editState?.published || initialValue.value

  const timelineStore = useTimelineStore({
    documentId,
    documentType,
    rev: params.rev,
    since: params.since,
  })

  const changesOpen = !!params.since

  // Subscribe to external timeline state changes
  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const diff = useTimelineSelector(timelineStore, (state) => state.diff)
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const realRevChunk = useTimelineSelector(timelineStore, (state) => state.realRevChunk)
  const sinceAttributes = useTimelineSelector(timelineStore, (state) => state.sinceAttributes)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)
  const timelineDisplayed = useTimelineSelector(timelineStore, (state) => state.timelineDisplayed)

  const compareValue: Partial<SanityDocument> | null = changesOpen ? sinceAttributes : null

  const ready = connectionState === 'connected' && editState.ready
  const isPreviousVersion = onOlderRevision

  const displayed: Partial<SanityDocument> | null = useMemo(
    () => (isPreviousVersion ? timelineDisplayed : value),
    [isPreviousVersion, timelineDisplayed, value],
  )

  const handleHistoryOpen = useCallback(() => {
    setParams((prevParams) => ({...prevParams, since: '@lastPublished'}))
  }, [])

  const handleHistoryClose = useCallback(() => {
    setParams((prevParams) => omit({...prevParams}, 'since'))
  }, [])

  const setTimelineRange = useCallback((newSince: string | null, newRev: string | null) => {
    setParams((prevParams) => ({
      ...prevParams,
      since: newSince || undefined,
      rev: newRev || undefined,
    }))
  }, [])

  const isComparingCurrent = !onOlderRevision

  const documentContext: DocumentChangeContextInstance = useMemo(
    () => ({
      documentId,
      schemaType: schemaType as any,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
      value,
    }),
    [diff, documentId, isComparingCurrent, schemaType, value],
  )

  const handleRevClick = useCallback(
    (chunk: Chunk) => () => {
      const [sinceId, revId] = timelineStore.findRangeForRev(chunk)
      setTimelineRange(sinceId, revId)
    },
    [setTimelineRange, timelineStore],
  )

  const handleSinceClick = useCallback(
    (chunk: Chunk) => () => {
      const [sinceId, revId] = timelineStore.findRangeForSince(chunk)
      setTimelineRange(sinceId, revId)
    },
    [setTimelineRange, timelineStore],
  )

  return (
    <Flex direction="column" height="fill">
      <Card borderBottom padding={2}>
        <Inline space={1}>
          <Button
            icon={RestoreIcon}
            mode="ghost"
            onClick={changesOpen ? handleHistoryClose : handleHistoryOpen}
            selected={changesOpen}
            text="Review changes"
          />
        </Inline>
      </Card>

      <Flex flex={1}>
        <Card flex={1} overflow="auto" padding={1}>
          <Flex gap={1}>
            <Stack flex={1} space={1}>
              <Box padding={3}>
                <Text size={1} weight="medium">
                  Revision
                </Text>
              </Box>
              {chunks.map((chunk) => {
                return (
                  <Card
                    as="button"
                    key={chunk.id}
                    onClick={handleRevClick(chunk)}
                    padding={3}
                    selected={realRevChunk === chunk}
                  >
                    <Stack space={2}>
                      <Text>{chunk.type}</Text>
                      <Text muted size={1}>
                        {format(new Date(chunk.endTimestamp), 'MMM d, YYY @ HH:mm')}
                      </Text>
                    </Stack>
                  </Card>
                )
              })}
            </Stack>
            {changesOpen && (
              <Stack flex={1} space={1}>
                <Box padding={3}>
                  <Text size={1} weight="medium">
                    Changes since
                  </Text>
                </Box>
                {chunks.map((chunk) => {
                  return (
                    <Card
                      as="button"
                      key={chunk.id}
                      onClick={handleSinceClick(chunk)}
                      padding={3}
                      selected={sinceTime === chunk}
                    >
                      <Stack space={2}>
                        <Text>{chunk.type}</Text>
                        <Text muted size={1}>
                          {format(new Date(chunk.endTimestamp), 'MMM d, YYY @ HH:mm')}
                        </Text>
                      </Stack>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Flex>
        </Card>

        <Card borderLeft flex={1} overflow="auto" padding={4}>
          {diff && schemaType && (
            <DocumentChangeContext.Provider value={documentContext}>
              <ChangeList diff={diff} schemaType={schemaType as any} />
            </DocumentChangeContext.Provider>
          )}

          {!changesOpen && <Text>No range selected</Text>}
        </Card>

        <Card borderLeft flex={1} overflow="auto" padding={4}>
          <Code language="json" size={1}>
            {JSON.stringify(
              {
                changesOpen,
                compareValue,
                diff,
                displayed,
                params,
                ready,
                viewOlderVersion: isPreviousVersion,
              },
              null,
              2,
            )}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
