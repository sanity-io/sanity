import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Badge, Button, Card, Stack, Text} from '@sanity/ui'
import {dequal} from 'dequal/lite'
import {type ReactNode, Suspense, use, useId, useMemo, useState} from 'react'
import {type TFunction, useDateTimeFormat, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {visionLocaleNamespace} from '../../../i18n'
import {type FetchHistoryEntry, type FetchReason} from '../../store/types'
import {omitFields, parseFieldPaths} from '../../util/omitFields'
import {
  formatQueryForDiff,
  getRequestChanges,
  type RequestChangeId,
} from '../../util/requestChanges'
import {sortSyncTags} from '../../util/syncTags'
import {CodeDiffLoader, DiffBoundary} from './LazyCodeDiff'

function describeFetchReason(reason: FetchReason, t: TFunction<'vision'>): string {
  switch (reason.type) {
    case 'manual':
      return t('vista.history.reason.manual')
    case 'shortcut':
      return t('vista.history.reason.shortcut')
    case 'options':
      return t('vista.history.reason.options')
    case 'load':
      return t('vista.history.reason.load')
    case 'resume':
      return t('vista.history.reason.resume')
    case 'live-start':
      return t('vista.history.reason.live-start')
    case 'generated':
      return t('vista.history.reason.generated')
    case 'mutation':
      return t('vista.history.reason.mutation')
    case 'live':
      return reason.matchedTags.length > 0
        ? t('vista.history.reason.live')
        : t('vista.history.reason.live-restart')
    default: {
      const exhaustive: never = reason
      return String(exhaustive)
    }
  }
}

function describeRequestChange(id: RequestChangeId, t: TFunction<'vision'>): string {
  switch (id) {
    case 'query':
      return t('vista.history.diff.query')
    case 'params':
      return t('vista.history.diff.params')
    case 'url':
      return t('vista.history.diff.url')
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
        <Text size={1} weight="medium">
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
      <Text data-testid="vista-history-query-formatting-only" muted size={1}>
        {t('vista.history.diff.query-formatting-only')}
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
  const formatTime = useDateTimeFormat({timeStyle: 'medium'})
  const notApplicable = t('result.timing-not-applicable')
  const [expanded, setExpanded] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const changesId = useId()
  const requestChanges = useMemo(
    () => (previous ? getRequestChanges(previous, entry) : []),
    [entry, previous],
  )
  // Formatted once the changes are shown. The promise is made here rather than in `QueryDiff`,
  // which suspends on it, since a component that suspends while mounting keeps no state or memo
  const queryTexts = useMemo(() => {
    if (!expanded || !previous || previous.query === entry.query) return undefined
    return Promise.all([formatQueryForDiff(previous.query), formatQueryForDiff(entry.query)]).then(
      ([previousText, nextText]) => ({previous: previousText, next: nextText}),
    )
  }, [entry.query, expanded, previous])
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
    status = t('vista.history.only-hidden-changed')
  } else if (entry.resultChange === 'changed' && !resultComparable) {
    status = t('vista.history.changed')
  } else if (entry.resultChange === 'unchanged') {
    status = t(requestChanges.length > 0 ? 'vista.history.same-result' : 'vista.history.unchanged')
  } else if (entry.resultChange === 'too-large') {
    status = t('vista.history.too-large')
  }

  return (
    <Card
      borderBottom
      data-testid="vista-history-entry"
      paddingX={3}
      paddingY={2}
      tone={entry.status === 'error' ? 'critical' : 'default'}
    >
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <Text muted size={1}>
          {formatTime.format(new Date(entry.requestedAt))}
        </Text>
        <Text size={1} weight="medium">
          {describeFetchReason(entry.reason, t)}
        </Text>
        {entry.reason.type === 'live' &&
          sortSyncTags(entry.reason.matchedTags).map((tag) => (
            <Badge fontSize={0} key={tag}>
              {tag}
            </Badge>
          ))}
        {status && (
          <Text muted size={1}>
            {status}
          </Text>
        )}
        {comparable && (
          <Button
            aria-controls={changesId}
            aria-expanded={expanded}
            data-testid="vista-history-changes-toggle"
            fontSize={1}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            mode="bleed"
            onClick={() => setExpanded((value) => !value)}
            padding={1}
            text={t('vista.history.changes')}
          />
        )}
        <Box flexBasis="0%" flexGrow={1} />
        {entry.network?.viaCdn && (
          <Badge
            data-testid="vista-history-cdn"
            fontSize={0}
            tone={entry.network.cacheHit ? 'positive' : 'default'}
          >
            {entry.network.cacheHit ? t('vista.history.cdn-cache-hit') : t('vista.history.cdn')}
          </Badge>
        )}
        {entry.status === 'error' ? (
          <Badge fontSize={0} tone="critical">
            {t('vista.history.failed')}
          </Badge>
        ) : (
          <Text muted size={1}>
            {`${t('result.execution-time-label')} ${entry.ms === undefined ? notApplicable : `${entry.ms}ms`} · ${t('result.end-to-end-time-label')} ${entry.e2eMs === undefined ? notApplicable : `${entry.e2eMs}ms`}`}
          </Text>
        )}
      </Flex>
      {entry.errorMessage && (
        <Box paddingTop={2}>
          <Text muted size={1} textOverflow="ellipsis">
            {entry.errorMessage}
          </Text>
        </Box>
      )}
      {comparable && expanded && previous && (
        <Stack data-testid="vista-history-changes" gap={3} id={changesId} paddingTop={2}>
          <Text muted size={1}>
            {t('vista.history.compared-with', {
              time: formatTime.format(new Date(previous.requestedAt)),
            })}
          </Text>
          <DiffBoundary
            renderFallback={(retry) => (
              <Flex alignItems="center" gap={2}>
                <Text muted size={1}>
                  {t('vista.history.changes-failed')}
                </Text>
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={retry}
                  padding={2}
                  text={t('vista.history.changes-retry')}
                />
              </Flex>
            )}
          >
            <Suspense fallback={<DelayedSpinner />}>
              <Stack gap={3}>
                {requestChanges.map((change) => (
                  <DiffSection
                    key={change.id}
                    label={describeRequestChange(change.id, t)}
                    testId={`vista-history-diff-${change.id}`}
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
                          <Text data-testid="vista-history-hidden-fields" muted size={1}>
                            {t(
                              showHidden ? 'vista.history.showing-hidden' : 'vista.history.hiding',
                              {fields: hiddenFields.join(', ')},
                            )}
                          </Text>
                          <Button
                            data-testid="vista-history-hidden-toggle"
                            fontSize={1}
                            mode="bleed"
                            onClick={() => setShowHidden((value) => !value)}
                            padding={1}
                            text={t(
                              showHidden
                                ? 'vista.history.hide-hidden'
                                : 'vista.history.show-hidden',
                            )}
                          />
                        </>
                      )
                    }
                    label={t('vista.history.diff.result')}
                    testId="vista-history-diff-result"
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
  /** Fields left out of the diffs (see `VistaHistoryDiffSettings`) */
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
        <Text muted size={1}>
          {t('vista.history.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack data-testid="vista-history">
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
