import {RestoreIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {Box, Button, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {omit} from 'lodash'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useMemoObservable} from 'react-rx'
import {ChangeFieldWrapper} from '../../components/changeIndicators'
import {
  ChangeList,
  DocumentChangeContext,
  DocumentChangeContextInstance,
  ObjectDiff,
} from '../../field'
import {useClient, useConnectionState, useEditState, useSchema} from '../../hooks'
import {useInitialValue} from '../document/useInitialValue'
import {useHistoryStore} from '../datastores'

export default function HistoryTimelineStory() {
  const client = useClient()
  const schema = useSchema()
  const documentId = useMemo(() => 'test', [])
  const documentType = useMemo(() => 'author', [])
  const schemaType = schema.get(documentType)
  const templateName = useMemo(() => undefined, [])
  const templateParams = useMemo(() => undefined, [])
  const [params, setParams] = useState<{rev?: string; since?: string}>({})

  const historyStore = useHistoryStore()

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

  const timeline = useMemo(
    () => historyStore.getTimeline({publishedId: documentId, enableTrace: true}),
    [documentId, historyStore]
  )

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useMemoObservable(
    () => historyStore.getTimelineController({client, documentId, documentType, timeline}),
    [client, documentId, documentType, timeline]
  )!

  const [, _forceUpdate] = useState(0)
  const forceUpdate = useCallback(() => _forceUpdate((p) => p + 1), [])

  useEffect(() => {
    historyController.setRange(params.since || null, params.rev || null)
    forceUpdate()
  }, [forceUpdate, historyController, params.rev, params.since])

  const changesOpen = historyController.changesPanelActive()

  const compareValue: Partial<SanityDocument> | null = changesOpen
    ? historyController.sinceAttributes()
    : null

  const ready = connectionState === 'connected' && editState.ready
  const isPreviousVersion = historyController.onOlderRevision()

  const displayed: Partial<SanityDocument> | null = useMemo(
    () => (isPreviousVersion ? historyController.displayed() : value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyController, params.rev, params.since, value, isPreviousVersion]
  )

  const diff: ObjectDiff | null = changesOpen ? historyController.currentObjectDiff() : null

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

  const isComparingCurrent = !historyController.onOlderRevision()

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
              {timeline.mapChunks((chunk) => {
                return (
                  <Card
                    as="button"
                    key={chunk.id}
                    onClick={() => {
                      const [sinceId, revId] = historyController.findRangeForNewRev(chunk)

                      setTimelineRange(sinceId, revId)
                    }}
                    padding={3}
                    selected={historyController.realRevChunk === chunk}
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
                {timeline.mapChunks((chunk) => {
                  return (
                    <Card
                      as="button"
                      key={chunk.id}
                      onClick={() => {
                        const [sinceId, revId] = historyController.findRangeForNewSince(chunk)

                        setTimelineRange(sinceId, revId)
                      }}
                      padding={3}
                      selected={historyController.sinceTime === chunk}
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
