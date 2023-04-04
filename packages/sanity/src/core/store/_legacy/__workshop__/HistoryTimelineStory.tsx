import {ObjectDiff} from '@sanity/diff'
import {RestoreIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {Box, Button, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {omit} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ChangeFieldWrapper} from '../../../changeIndicators'
import {
  Annotation,
  ChangeList,
  Chunk,
  DocumentChangeContext,
  DocumentChangeContextInstance,
} from '../../../field'
import {useConnectionState, useEditState, useSchema} from '../../../hooks'
import {useInitialValue} from '../document'
import {TimelineController, useTimelineController} from '../history'

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

  const {timelineController$} = useTimelineController({
    documentId,
    documentType,
    rev: params.rev,
    since: params.since,
  })

  const timelineControllerRef = useRef<TimelineController | null>(null)

  // Subscribe to TimelineController changes and store internal state.
  const [changesOpen, setChangesOpen] = useState(false)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [diff, setDiff] = useState<ObjectDiff<Annotation, Record<string, any>> | null>(null)
  const [onOlderRevision, setOnOlderRevision] = useState(false)
  const [realRevChunk, setRealRevChunk] = useState<Chunk | null>(null)
  const [sinceAttributes, setSinceAttributes] = useState<Record<string, unknown> | null>(null)
  const [sinceTime, setSinceTime] = useState<Chunk | null>(null)
  const [timelineDisplayed, setTimelineDisplayed] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    setChangesOpen(!!params.since)
    const subscription = timelineController$.subscribe((controller) => {
      timelineControllerRef.current = controller
      setChunks(controller.timeline.mapChunks((c) => c))
      setDiff(controller.sinceTime ? controller.currentObjectDiff() : null)
      setOnOlderRevision(controller.onOlderRevision())
      setRealRevChunk(controller.realRevChunk)
      setSinceAttributes(controller.sinceAttributes())
      setSinceTime(controller.sinceTime)
      setTimelineDisplayed(controller.displayed())
    })
    return () => subscription.unsubscribe()
  }, [params.since, timelineController$])

  const compareValue: Partial<SanityDocument> | null = changesOpen ? sinceAttributes : null

  const ready = connectionState === 'connected' && editState.ready
  const isPreviousVersion = onOlderRevision

  const displayed: Partial<SanityDocument> | null = useMemo(
    () => (isPreviousVersion ? timelineDisplayed : value),
    [isPreviousVersion, timelineDisplayed, value]
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
    [diff, documentId, isComparingCurrent, schemaType, value]
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
                <Text size={1} weight="semibold">
                  Revision
                </Text>
              </Box>
              {chunks.map((chunk) => {
                return (
                  <Card
                    as="button"
                    key={chunk.id}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => {
                      if (timelineControllerRef.current) {
                        const [sinceId, revId] =
                          timelineControllerRef.current.findRangeForNewRev(chunk)
                        setTimelineRange(sinceId, revId)
                      }
                    }}
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
                  <Text size={1} weight="semibold">
                    Changes since
                  </Text>
                </Box>
                {chunks.map((chunk) => {
                  return (
                    <Card
                      as="button"
                      key={chunk.id}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={() => {
                        if (timelineControllerRef.current) {
                          const [sinceId, revId] =
                            timelineControllerRef.current.findRangeForNewSince(chunk)
                          setTimelineRange(sinceId, revId)
                        }
                      }}
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
              2
            )}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
