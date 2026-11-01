import {Badge, Button, Card, Label, Select, Stack, Text, TextInput} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useCallback, useEffect, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex, Grid} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequest} from '../../store/types'
import {
  deltaOperation,
  type DocumentRevision,
  evaluateDelta,
  type HistoryClient,
  loadRevision,
  loadRevisions,
} from '../../util/deltaQuery'
import * as styles from '../redesign.module.css'
import {JsonEditor} from './JsonEditor'

/** Edits settle this long before the query is evaluated again */
const EVALUATE_DELAY_MS = 300

/** The documents to compare, kept by the response panel so they survive switching panels */
export interface DeltaPanelState {
  documentId: string
  revisions: DocumentRevision[] | undefined
  loading: boolean
  loadError: string | undefined
  /** A revision id, or `''` for no document on that side */
  beforeRevision: string
  afterRevision: string
  /** JSON; empty for no document on that side */
  beforeText: string
  afterText: string
}

const INITIAL_STATE: DeltaPanelState = {
  documentId: '',
  revisions: undefined,
  loading: false,
  loadError: undefined,
  beforeRevision: '',
  afterRevision: '',
  beforeText: '',
  afterText: '',
}

function toText(document: unknown): string {
  return document === null ? '' : JSON.stringify(document, null, 2)
}

export interface DeltaPanel {
  state: DeltaPanelState
  setDocumentId: (documentId: string) => void
  /** Loads the document's revisions, the latest as After and the one before it as Before */
  load: (client: HistoryClient, documentId: string) => Promise<void>
  select: (
    client: HistoryClient,
    documentId: string,
    side: 'before' | 'after',
    revision: string,
  ) => Promise<void>
  setText: (side: 'before' | 'after', text: string) => void
}

export function useDeltaPanel(): DeltaPanel {
  const [state, setState] = useState<DeltaPanelState>(INITIAL_STATE)

  const setDocumentId = useCallback((documentId: string) => {
    setState((current) => ({...current, documentId}))
  }, [])

  const load = useCallback(async (client: HistoryClient, id: string) => {
    const documentId = id.trim()
    if (!documentId) return
    setState((current) => ({...current, loading: true, loadError: undefined}))
    try {
      const revisions = await loadRevisions(client, documentId)
      const [latest, previous] = revisions
      const [after, before] = await Promise.all([
        latest ? loadRevision(client, documentId, latest.id) : null,
        previous ? loadRevision(client, documentId, previous.id) : null,
      ])
      setState((current) => ({
        ...current,
        loading: false,
        revisions,
        afterRevision: latest?.id ?? '',
        beforeRevision: previous?.id ?? '',
        afterText: toText(after),
        beforeText: toText(before),
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        loadError: error instanceof Error ? error.message : String(error),
      }))
    }
  }, [])

  const select = useCallback(
    async (client: HistoryClient, id: string, side: 'before' | 'after', revision: string) => {
      const documentId = id.trim()
      const key = side === 'before' ? 'beforeRevision' : 'afterRevision'
      const textKey = side === 'before' ? 'beforeText' : 'afterText'
      setState((current) => ({...current, [key]: revision}))
      if (!revision) {
        setState((current) => ({...current, [textKey]: ''}))
        return
      }
      try {
        const document = await loadRevision(client, documentId, revision)
        setState((current) =>
          current[key] === revision ? {...current, [textKey]: toText(document)} : current,
        )
      } catch (error) {
        setState((current) => ({
          ...current,
          loadError: error instanceof Error ? error.message : String(error),
        }))
      }
    },
    [],
  )

  const setText = useCallback((side: 'before' | 'after', text: string) => {
    setState((current) => ({...current, [side === 'before' ? 'beforeText' : 'afterText']: text}))
  }, [])

  return {state, setDocumentId, load, select, setText}
}

type Evaluation =
  | {status: 'idle'}
  | {status: 'invalid'; side: 'before' | 'after'; message: string}
  | {status: 'failed'; message: string}
  | {status: 'done'; value: unknown}

function readDocument(text: string): {value: unknown} | {error: string} {
  if (!text.trim()) return {value: null}
  try {
    return {value: JSON.parse(text)}
  } catch (error) {
    return {error: error instanceof Error ? error.message : String(error)}
  }
}

export interface DeltaTabProps {
  delta: DeltaPanel
  /** What the tab would fetch now: the query and params to evaluate, and the client for history */
  request: QueryRequest | null
}

/**
 * The query in delta mode, the way GROQ-powered webhooks, listeners and Sanity Functions run it,
 * against a document before and after a change: two revisions from the History API, or JSON
 * typed or pasted in, an empty side being no document (a create or a delete)
 */
export function DeltaTab({delta, request}: DeltaTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {state} = delta
  const query = request?.query.trim() ? request.query : ''
  // The params by value, so a new object with the same params does not evaluate again
  const paramsKey = JSON.stringify(request?.params ?? {})
  const before = readDocument(state.beforeText)
  const after = readDocument(state.afterText)
  const ready =
    query !== '' &&
    'value' in before &&
    'value' in after &&
    (before.value !== null || after.value !== null)
  const evaluationKey = ready
    ? JSON.stringify([query, paramsKey, state.beforeText, state.afterText])
    : ''
  const [evaluated, setEvaluated] = useState<{key: string; outcome: Evaluation} | null>(null)

  useEffect(() => {
    if (!evaluationKey) return undefined
    const beforeValue = readDocumentValue(state.beforeText)
    const afterValue = readDocumentValue(state.afterText)
    const parsedParams: unknown = JSON.parse(paramsKey)
    const params =
      typeof parsedParams === 'object' && parsedParams !== null
        ? Object.fromEntries(Object.entries(parsedParams))
        : {}
    let cancelled = false
    const timer = setTimeout(() => {
      evaluateDelta({query, params, before: beforeValue, after: afterValue}).then(
        (value) => {
          if (!cancelled) setEvaluated({key: evaluationKey, outcome: {status: 'done', value}})
        },
        (error: unknown) => {
          if (cancelled) return
          setEvaluated({
            key: evaluationKey,
            outcome: {
              status: 'failed',
              message: error instanceof Error ? error.message : String(error),
            },
          })
        },
      )
    }, EVALUATE_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [evaluationKey, paramsKey, query, state.afterText, state.beforeText])

  let evaluation: Evaluation = {status: 'idle'}
  if ('error' in before) evaluation = {status: 'invalid', side: 'before', message: before.error}
  else if ('error' in after) evaluation = {status: 'invalid', side: 'after', message: after.error}
  else if (evaluated && evaluated.key === evaluationKey) evaluation = evaluated.outcome

  const operation = deltaOperation(
    readDocumentValue(state.beforeText),
    readDocumentValue(state.afterText),
  )
  const client = request?.client
  const formatTime = new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'medium'})
  const revisionOptions = (state.revisions ?? []).map((revision) => (
    <option key={revision.id} value={revision.id}>
      {t('vision.delta.revision.option', {
        time: revision.timestamp ? formatTime.format(new Date(revision.timestamp)) : '',
        revision: revision.id,
      })}
    </option>
  ))

  return (
    // Scrolls only in a drawer too short for the least room the documents take
    <Flex
      data-testid="vision-delta"
      flexDirection="column"
      gap={4}
      height="100%"
      overflow="auto"
      padding={3}
    >
      <Text muted size={1}>
        {t('vision.delta.description')}
      </Text>
      <Flex alignItems="flex-end" flexShrink={0} gap={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <Stack gap={2}>
            <Label muted size={0}>
              {t('vision.delta.document-id')}
            </Label>
            <TextInput
              data-testid="vision-delta-document-id"
              fontSize={1}
              onChange={(event) => delta.setDocumentId(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && client) void delta.load(client, state.documentId)
              }}
              padding={2}
              value={state.documentId}
            />
          </Stack>
        </Box>
        <Button
          data-testid="vision-delta-load"
          disabled={!client || !state.documentId.trim() || state.loading}
          fontSize={1}
          loading={state.loading}
          mode="ghost"
          onClick={() => client && void delta.load(client, state.documentId)}
          padding={2}
          text={t('vision.delta.load')}
        />
      </Flex>
      {state.loadError && (
        <Text data-testid="vision-delta-load-error" size={1}>
          {t('vision.delta.load-failed', {message: state.loadError})}
        </Text>
      )}
      {/* The result is as tall as it needs up to two fifths of the room, its value scrolling past
          that; the two documents share the rest */}
      <Grid
        flexBasis="0%"
        flexGrow={1}
        gap={4}
        gridTemplateRows="fit-content(40%) minmax(0, 1fr)"
        minHeight="320px"
      >
        <DeltaResult evaluation={evaluation} operation={operation} request={request} />
        <Flex flexDirection="column" gap={3} minHeight="0">
          <JsonEditor
            actions={
              state.revisions && (
                <Box flexShrink={1} minWidth="0">
                  <Select
                    aria-label={t('vision.delta.before')}
                    data-testid="vision-delta-before-revision"
                    fontSize={1}
                    onChange={(event) =>
                      client &&
                      void delta.select(
                        client,
                        state.documentId,
                        'before',
                        event.currentTarget.value,
                      )
                    }
                    padding={2}
                    value={state.beforeRevision}
                  >
                    <option value="">{t('vision.delta.revision.none-before')}</option>
                    {revisionOptions}
                  </Select>
                </Box>
              )
            }
            label={t('vision.delta.before')}
            onChange={(text) => delta.setText('before', text)}
            testId="vision-delta-before"
            value={state.beforeText}
          />
          <JsonEditor
            actions={
              state.revisions && (
                <Box flexShrink={1} minWidth="0">
                  <Select
                    aria-label={t('vision.delta.after')}
                    data-testid="vision-delta-after-revision"
                    fontSize={1}
                    onChange={(event) =>
                      client &&
                      void delta.select(
                        client,
                        state.documentId,
                        'after',
                        event.currentTarget.value,
                      )
                    }
                    padding={2}
                    value={state.afterRevision}
                  >
                    {revisionOptions}
                    <option value="">{t('vision.delta.revision.none-after')}</option>
                  </Select>
                </Box>
              )
            }
            label={t('vision.delta.after')}
            onChange={(text) => delta.setText('after', text)}
            testId="vision-delta-after"
            value={state.afterText}
          />
        </Flex>
      </Grid>
    </Flex>
  )
}

function DeltaResult(props: {
  operation: string | null
  request: QueryRequest | null
  evaluation: Evaluation
}) {
  const {operation, request, evaluation} = props
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Flex
      data-testid="vision-delta-result"
      flexDirection="column"
      gap={3}
      minHeight="0"
      overflow="auto"
      // Room for the last line of text, which Text draws a few pixels below its box
      paddingBottom={2}
    >
      <Flex alignItems="center" flexShrink={0} gap={2}>
        <Label muted size={0}>
          {t('vision.delta.result')}
        </Label>
        {operation && (
          <Badge data-testid="vision-delta-operation" fontSize={0}>
            {operation}
          </Badge>
        )}
      </Flex>
      {!request && (
        <Text muted size={1}>
          {t('vision.delta.no-request')}
        </Text>
      )}
      {request && evaluation.status === 'idle' && (
        <Text muted size={1}>
          {t('vision.delta.empty')}
        </Text>
      )}
      {evaluation.status === 'invalid' && (
        <Text size={1}>
          {evaluation.side === 'before'
            ? t('vision.delta.invalid-before', {message: evaluation.message})
            : t('vision.delta.invalid-after', {message: evaluation.message})}
        </Text>
      )}
      {evaluation.status === 'failed' && (
        <Text size={1}>{t('vision.delta.failed', {message: evaluation.message})}</Text>
      )}
      {evaluation.status === 'done' && typeof evaluation.value === 'boolean' && (
        <Card
          border
          data-testid="vision-delta-match"
          padding={3}
          radius={2}
          tone={evaluation.value ? 'positive' : 'caution'}
        >
          <Text size={1}>
            {evaluation.value ? t('vision.delta.matches') : t('vision.delta.no-match')}
          </Text>
        </Card>
      )}
      {evaluation.status === 'done' && typeof evaluation.value !== 'boolean' && (
        <Card border className={styles.drawerScroller} padding={3} radius={2}>
          <Code data-testid="vision-delta-value" size={1}>
            {JSON.stringify(evaluation.value, null, 2) ?? 'null'}
          </Code>
        </Card>
      )}
    </Flex>
  )
}

function readDocumentValue(text: string): unknown {
  const read = readDocument(text)
  return 'value' in read ? read.value : undefined
}
