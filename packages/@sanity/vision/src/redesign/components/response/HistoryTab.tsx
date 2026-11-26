import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Badge, Button, Card, Stack} from '@sanity/ui'
import {dequal} from 'dequal/lite'
import {type ReactNode, Suspense, use, useId, useMemo, useState} from 'react'
import {type TFunction, useDateTimeFormat} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {visionLocaleNamespace} from '../../../i18n'
import {formatMeasuredDuration} from '../../../util/formatDuration'
import {
  type AiLintFinding,
  type AiQueryChange,
  type FetchHistoryEntry,
  type FetchReason,
} from '../../store/types'
import {omitFields, parseFieldPaths} from '../../util/omitFields'
import {formatExecutionTime} from '../../util/queryNetwork'
import {
  formatQueryForDiff,
  getRequestChanges,
  type RequestChange,
  type RequestChangeId,
} from '../../util/requestChanges'
import {sortSyncTags} from '../../util/syncTags'
import * as styles from './historyTab.module.css'
import {CodeDiffLoader, DiffBoundary} from './LazyCodeDiff'
import * as motion from './responseTabs.module.css'
import {RichText} from './RichText'

function describeFetchReason(reason: FetchReason, t: TFunction<'vision'>): string {
  switch (reason.type) {
    case 'manual':
      return t('vision.history.reason.manual')
    case 'shortcut':
      return t('vision.history.reason.shortcut')
    case 'options':
      return t('vision.history.reason.options')
    case 'load':
      return t('vision.history.reason.load')
    case 'resume':
      return t('vision.history.reason.resume')
    case 'generated':
      return reason.ai ? describeAiAction(reason.ai, t) : t('vision.history.reason.generated')
    case 'paste':
      return t('vision.history.reason.paste')
    case 'link':
      return t('vision.history.reason.link')
    case 'live':
      return reason.matchedTags.length > 0
        ? t('vision.history.reason.live')
        : t('vision.history.reason.live-restart')
    default: {
      const exhaustive: never = reason
      return String(exhaustive)
    }
  }
}

function describeAiAction(change: AiQueryChange, t: TFunction<'vision'>): string {
  switch (change.action) {
    case 'generate':
      return t('vision.history.reason.ai.generate')
    case 'edit':
      return t('vision.history.reason.ai.edit')
    case 'fix-lint':
      return t('vision.history.reason.ai.fix-lint')
    case 'improve':
      return t('vision.history.reason.ai.improve')
    case 'fit-document-list':
      return t('vision.history.reason.ai.fit-document-list')
    default: {
      const exhaustive: never = change
      return String(exhaustive)
    }
  }
}

const SEVERITY_TONE = {
  error: 'critical',
  warning: 'caution',
  info: 'primary',
  hint: 'default',
} as const satisfies Record<AiLintFinding['severity'], string>

function AiSection(props: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={0} weight="medium" as="div" trim={true}>
        {props.label}
      </Text>
      {props.children}
    </Stack>
  )
}

/**
 * What an AI action that wrote the query was given: the description the user wrote, the lint
 * findings it fixed, or the explanation it followed. The panel that ran it clears once the query
 * is in the editor, so this is where it can be read again.
 */
function AiTrigger(props: {change: AiQueryChange}) {
  const {change} = props
  const {t} = useTranslation(visionLocaleNamespace)
  let content: ReactNode
  switch (change.action) {
    case 'generate':
    case 'edit':
      content = (
        <AiSection label={t('vision.history.ai.prompt')}>
          <Text className={styles.prompt} data-testid="vision-history-ai-prompt" size={1} as="div">
            {change.prompt}
          </Text>
        </AiSection>
      )
      break
    case 'fix-lint':
      content = (
        <AiSection label={t('vision.history.ai.lint-findings')}>
          <Stack as="ul" className={styles.list} data-testid="vision-history-ai-findings" gap={2}>
            {change.findings.map((finding, index) => (
              <Flex alignItems="flex-start" as="li" gap={2} key={index}>
                <Badge fontSize={0} tone={SEVERITY_TONE[finding.severity]}>
                  {finding.severity}
                </Badge>
                <Stack flex={1} gap={2}>
                  <Text size={1} as="div">
                    <RichText text={finding.message} />
                  </Text>
                  <Text muted size={0} as="div" trim={true}>
                    {t('vision.history.ai.lint-location', {
                      line: finding.line,
                      column: finding.column,
                    })}
                  </Text>
                </Stack>
              </Flex>
            ))}
          </Stack>
        </AiSection>
      )
      break
    case 'improve':
      content = (
        <>
          {change.summary && (
            <AiSection label={t('vision.history.ai.explanation')}>
              <Text className={styles.prompt} size={1} as="div">
                <RichText text={change.summary} />
              </Text>
            </AiSection>
          )}
          {change.suggestions.length > 0 && (
            <AiSection label={t('vision.history.ai.suggestions')}>
              <Stack
                as="ol"
                className={styles.list}
                data-testid="vision-history-ai-suggestions"
                gap={2}
              >
                {change.suggestions.map((suggestion, index) => (
                  <Flex as="li" gap={2} key={index}>
                    <Text muted size={1} as="span">
                      {index + 1}.
                    </Text>
                    <Text className={styles.prompt} size={1} as="div">
                      <RichText text={suggestion} />
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </AiSection>
          )}
        </>
      )
      break
    case 'fit-document-list':
      content = (
        <Text muted size={1} as="div">
          {t('vision.history.ai.fit-document-list')}
        </Text>
      )
      break
    default: {
      const exhaustive: never = change
      content = String(exhaustive)
    }
  }
  return (
    <Card
      className={styles.trigger}
      data-action={change.action}
      data-testid="vision-history-ai"
      padding={3}
      radius={2}
      tone="suggest"
    >
      <Flex gap={3}>
        <Text className={styles.icon} size={1} as="div">
          <SparklesIcon />
        </Text>
        <Stack flex={1} gap={3}>
          {content}
        </Stack>
      </Flex>
    </Card>
  )
}

function describeRequestChange(id: RequestChangeId, t: TFunction<'vision'>): string {
  switch (id) {
    case 'query':
      return t('vision.history.diff.query')
    case 'params':
      return t('vision.history.diff.params')
    case 'url':
      return t('vision.history.diff.url')
    default: {
      const exhaustive: never = id
      return String(exhaustive)
    }
  }
}

function toJson(value: unknown): string {
  // Indented like the copied and exported JSON, so a changed value is a changed line
  return `${JSON.stringify(value, null, 2)}\n`
}

function DiffSection(props: {
  label: string
  testId: string
  actions?: ReactNode
  children: ReactNode
}) {
  const {label, testId, actions, children} = props
  return (
    <Stack data-testid={testId} gap={2}>
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <Text size={1} weight="medium" as="div" trim={true}>
          {label}
        </Text>
        {actions}
      </Flex>
      {children}
    </Stack>
  )
}

interface QueryDiffTexts {
  previous: string
  next: string
}

function QueryDiff(props: {texts: Promise<QueryDiffTexts>}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {previous, next} = use(props.texts)
  if (previous === next) {
    return (
      <Text data-testid="vision-history-query-formatting-only" muted size={1} as="div" trim={true}>
        {t('vision.history.diff.query-formatting-only')}
      </Text>
    )
  }
  return <CodeDiffLoader lang="text" next={next} previous={previous} />
}

function HistoryEntry(props: {
  entry: FetchHistoryEntry
  /** The successful fetch before this one, which the request and result are compared with */
  previous: FetchHistoryEntry | undefined
  /** Fields left out of the diff, as set in the settings, and split into path segments */
  hiddenFields: string[]
  hiddenPaths: string[][]
}) {
  const {entry, previous, hiddenFields, hiddenPaths} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const telemetry = useVisionTelemetry()
  const formatTime = useDateTimeFormat({timeStyle: 'medium'})
  const notApplicable = t('result.timing-not-applicable')
  const [expanded, setExpanded] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const changesId = useId()
  const ai = entry.reason.type === 'generated' ? entry.reason.ai : undefined
  // A query an AI action wrote is compared with the one the action started from, which may have
  // been edited since the previous fetch; the params and URL are compared with that fetch
  const queryBefore = ai ? ai.fromQuery : previous?.query
  const requestChanges = useMemo(() => {
    const changes = previous ? getRequestChanges(previous, entry) : []
    if (!ai) return changes
    const rest = changes.filter((change) => change.id !== 'query')
    if (ai.fromQuery === entry.query) return rest
    const query: RequestChange = {
      id: 'query',
      previous: ai.fromQuery,
      next: entry.query,
      lang: 'text',
    }
    return [query, ...rest]
  }, [ai, entry, previous])
  // Formatted once the changes are shown. The promise is made here rather than in `QueryDiff`,
  // which suspends on it, since a component that suspends while mounting keeps no state or memo
  const queryTexts = useMemo(() => {
    if (!expanded || queryBefore === undefined || queryBefore === entry.query) return undefined
    return Promise.all([formatQueryForDiff(queryBefore), formatQueryForDiff(entry.query)]).then(
      ([previousText, nextText]) => ({previous: previousText, next: nextText}),
    )
  }, [entry.query, expanded, queryBefore])
  const nextResult = entry.result
  const previousResult = previous?.result
  const resultComparable =
    entry.resultChange === 'changed' && nextResult !== undefined && previousResult !== undefined
  const comparable = resultComparable || requestChanges.length > 0
  // The results without the hidden fields, which change with every revision
  const shown = useMemo(() => {
    if (!resultComparable || hiddenPaths.length === 0) return undefined
    const previousShown = omitFields(previousResult.value, hiddenPaths)
    const nextShown = omitFields(nextResult.value, hiddenPaths)
    // Results without hidden fields come back as they are, and there is nothing to hide then
    if (previousShown === previousResult.value && nextShown === nextResult.value) return undefined
    return {previous: previousShown, next: nextShown, same: dequal(previousShown, nextShown)}
  }, [hiddenPaths, nextResult, previousResult, resultComparable])
  const onlyHiddenChanged = shown?.same === true
  // When only hidden fields changed, the diff without them would be empty
  const diffed = shown && !showHidden && !onlyHiddenChanged ? shown : undefined
  const resultDiff = useMemo(() => {
    if (!resultComparable) return undefined
    return {
      previous: toJson(diffed ? diffed.previous : previousResult.value),
      next: toJson(diffed ? diffed.next : nextResult.value),
    }
  }, [diffed, nextResult, previousResult, resultComparable])

  let status: string | undefined
  if (onlyHiddenChanged) {
    status = t('vision.history.only-hidden-changed')
  } else if (entry.resultChange === 'changed' && !resultComparable) {
    status = t('vision.history.changed')
  } else if (entry.resultChange === 'unchanged') {
    status = t(
      requestChanges.length > 0 ? 'vision.history.same-result' : 'vision.history.unchanged',
    )
  } else if (entry.resultChange === 'too-large') {
    status = t('vision.history.too-large')
  }

  return (
    <Card
      borderBottom
      data-testid="vision-history-entry"
      paddingX={3}
      paddingY={2}
      tone={entry.status === 'error' ? 'critical' : 'default'}
    >
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <Text
          muted
          size={1}
          as="div"
          trim={true}
          tone={entry.status === 'error' ? 'critical' : undefined}
        >
          {formatTime.format(new Date(entry.requestedAt))}
        </Text>
        <Text
          size={1}
          weight="medium"
          as="div"
          trim={true}
          tone={entry.status === 'error' ? 'critical' : undefined}
        >
          <Flex alignItems="center" as="span" gap={2}>
            {ai && (
              <span className={styles.icon}>
                <SparklesIcon />
              </span>
            )}
            {describeFetchReason(entry.reason, t)}
          </Flex>
        </Text>
        {entry.reason.type === 'live' &&
          sortSyncTags(entry.reason.matchedTags).map((tag) => (
            <Badge fontSize={0} key={tag}>
              {tag}
            </Badge>
          ))}
        {status && (
          <Text
            muted
            size={1}
            as="div"
            trim={true}
            tone={entry.status === 'error' ? 'critical' : undefined}
          >
            {status}
          </Text>
        )}
        {comparable && (
          <Button
            aria-controls={changesId}
            aria-expanded={expanded}
            data-testid="vision-history-changes-toggle"
            fontSize={1}
            gap={2}
            icon={
              <span className={motion.chevron}>
                <ChevronRightIcon />
              </span>
            }
            mode="bleed"
            onClick={() => {
              if (!expanded) telemetry.historyUsed('view-changes')
              setExpanded((value) => !value)
            }}
            padding={1}
            text={t('vision.history.changes')}
          />
        )}
        <Box flexBasis="0%" flexGrow={1} />
        {/* An answer given on this device never reached the CDN, whatever host it was asked of. */}
        {entry.network?.viaCdn && !entry.network.local && (
          <Badge
            data-testid="vision-history-cdn"
            fontSize={0}
            tone={entry.network.cacheHit ? 'positive' : 'default'}
          >
            {entry.network.cacheHit ? t('vision.history.cdn-cache-hit') : t('vision.history.cdn')}
          </Badge>
        )}
        {entry.status === 'error' ? (
          <Badge fontSize={0} tone="critical">
            {t('vision.history.failed')}
          </Badge>
        ) : (
          <Text muted size={1} as="div" trim={true}>
            {`${t('result.execution-time-label')} ${formatExecutionTime(entry.ms, entry.network) ?? notApplicable} · ${t('result.end-to-end-time-label')} ${entry.e2eMs === undefined ? notApplicable : formatMeasuredDuration(entry.e2eMs)}`}
          </Text>
        )}
      </Flex>
      {entry.errorMessage && (
        <Box paddingTop={2}>
          <Text
            muted
            size={1}
            truncate={1}
            as="div"
            trim={true}
            tone={entry.status === 'error' ? 'critical' : undefined}
          >
            {entry.errorMessage}
          </Text>
        </Box>
      )}
      {ai && (
        <Box paddingTop={2}>
          <AiTrigger change={ai} />
        </Box>
      )}
      {comparable && expanded && (
        <Stack
          className={motion.reveal}
          data-testid="vision-history-changes"
          gap={3}
          id={changesId}
          paddingTop={2}
        >
          {previous && (
            <Text
              muted
              size={1}
              as="div"
              trim={true}
              tone={entry.status === 'error' ? 'critical' : undefined}
            >
              {t('vision.history.compared-with', {
                time: formatTime.format(new Date(previous.requestedAt)),
              })}
            </Text>
          )}
          <DiffBoundary
            renderFallback={(retry) => (
              <Flex alignItems="center" gap={2}>
                <Text
                  muted
                  size={1}
                  as="div"
                  trim={true}
                  tone={entry.status === 'error' ? 'critical' : undefined}
                >
                  {t('vision.history.changes-failed')}
                </Text>
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={() => {
                    telemetry.historyUsed('retry')
                    retry()
                  }}
                  padding={2}
                  text={t('vision.history.changes-retry')}
                />
              </Flex>
            )}
          >
            <Suspense fallback={<DelayedSpinner />}>
              <Stack gap={3}>
                {requestChanges.map((change) => (
                  <DiffSection
                    key={change.id}
                    label={
                      ai && change.id === 'query'
                        ? t('vision.history.diff.ai-query')
                        : describeRequestChange(change.id, t)
                    }
                    testId={`vision-history-diff-${change.id}`}
                  >
                    {change.id === 'query' && queryTexts ? (
                      <Suspense fallback={<DelayedSpinner />}>
                        <QueryDiff texts={queryTexts} />
                      </Suspense>
                    ) : (
                      <CodeDiffLoader
                        lang={change.lang}
                        next={change.next}
                        previous={change.previous}
                      />
                    )}
                  </DiffSection>
                ))}
                {resultDiff && (
                  <DiffSection
                    actions={
                      shown &&
                      !onlyHiddenChanged && (
                        <>
                          <Text
                            data-testid="vision-history-hidden-fields"
                            muted
                            size={1}
                            as="div"
                            trim={true}
                            tone={entry.status === 'error' ? 'critical' : undefined}
                          >
                            {t(
                              showHidden
                                ? 'vision.history.showing-hidden'
                                : 'vision.history.hiding',
                              {fields: hiddenFields.join(', ')},
                            )}
                          </Text>
                          <Button
                            data-testid="vision-history-hidden-toggle"
                            fontSize={1}
                            mode="bleed"
                            onClick={() => {
                              if (!showHidden) telemetry.historyUsed('show-hidden')
                              setShowHidden((value) => !value)
                            }}
                            padding={1}
                            text={t(
                              showHidden
                                ? 'vision.history.hide-hidden'
                                : 'vision.history.show-hidden',
                            )}
                          />
                        </>
                      )
                    }
                    label={t('vision.history.diff.result')}
                    testId="vision-history-diff-result"
                  >
                    <CodeDiffLoader
                      lang="json"
                      next={resultDiff.next}
                      previous={resultDiff.previous}
                    />
                  </DiffSection>
                )}
              </Stack>
            </Suspense>
          </DiffBoundary>
        </Stack>
      )}
    </Card>
  )
}

export function HistoryTab(props: {
  history: FetchHistoryEntry[]
  /** Fields left out of the diffs (see `VisionHistoryDiffSettings`) */
  hiddenFields: string[]
}) {
  const {history, hiddenFields} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const hiddenPaths = useMemo(() => parseFieldPaths(hiddenFields), [hiddenFields])
  // Newest first: the entry an entry is compared with is the next successful one in the list
  const previousSuccess = useMemo(() => {
    const previous = new Map<string, FetchHistoryEntry>()
    let older: FetchHistoryEntry | undefined
    for (let index = history.length - 1; index >= 0; index--) {
      const entry = history[index]
      if (older) previous.set(entry.id, older)
      if (entry.status === 'ok') older = entry
    }
    return previous
  }, [history])

  if (history.length === 0) {
    return (
      <Box padding={3}>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.history.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack data-testid="vision-history">
      {history.map((entry) => (
        <HistoryEntry
          entry={entry}
          hiddenFields={hiddenFields}
          hiddenPaths={hiddenPaths}
          key={entry.id}
          previous={previousSuccess.get(entry.id)}
        />
      ))}
    </Stack>
  )
}
