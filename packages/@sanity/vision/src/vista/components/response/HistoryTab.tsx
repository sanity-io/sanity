import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Badge, Button, Card, Stack, Text} from '@sanity/ui'
import {dequal} from 'dequal/lite'
import {Component, type ReactNode, Suspense, useId, useMemo, useState} from 'react'
import {type TFunction, useDateTimeFormat, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {visionLocaleNamespace} from '../../../i18n'
import {createRetryableLazy} from '../../../util/createRetryableLazy'
import {type FetchHistoryEntry, type FetchReason} from '../../store/types'
import {omitFields, parseFieldPaths} from '../../util/omitFields'

// The diff (`@pierre/diffs` and Shiki) only loads once a history entry's changes are expanded,
// and a failed load can be retried from the boundary
const resultDiff = createRetryableLazy(() => import('./ResultDiff'))
const ResultDiffLoader = resultDiff.Component

interface ResultDiffBoundaryProps {
  children: ReactNode
  renderFallback: (retry: () => void) => ReactNode
}

class ResultDiffBoundary extends Component<ResultDiffBoundaryProps, {failed: boolean}> {
  state = {failed: false}

  static getDerivedStateFromError() {
    return {failed: true}
  }

  retry = () => {
    resultDiff.retry()
    this.setState({failed: false})
  }

  render() {
    return this.state.failed ? this.props.renderFallback(this.retry) : this.props.children
  }
}

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

function HistoryEntry(props: {
  entry: FetchHistoryEntry
  /** The successful fetch before this one, which the result is compared with */
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
  const nextResult = entry.result
  const previousResult = previous?.result
  const comparable =
    entry.resultChange === 'changed' && nextResult !== undefined && previousResult !== undefined
  // The results without the hidden fields, which change with every revision
  const shown = useMemo(() => {
    if (!comparable || hiddenPaths.length === 0) return undefined
    const previousShown = omitFields(previousResult.value, hiddenPaths)
    const nextShown = omitFields(nextResult.value, hiddenPaths)
    return {previous: previousShown, next: nextShown, same: dequal(previousShown, nextShown)}
  }, [comparable, hiddenPaths, nextResult, previousResult])
  const onlyHiddenChanged = shown?.same === true
  // When only hidden fields changed, the diff without them would be empty
  const diffed = shown && !showHidden && !onlyHiddenChanged ? shown : undefined

  let change: ReactNode = null
  if (comparable) {
    change = (
      <>
        {onlyHiddenChanged && (
          <Text muted size={1}>
            {t('vista.history.only-hidden-changed')}
          </Text>
        )}
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
      </>
    )
  } else if (entry.resultChange === 'changed') {
    change = (
      <Text muted size={1}>
        {t('vista.history.changed')}
      </Text>
    )
  } else if (entry.resultChange === 'unchanged') {
    change = (
      <Text muted size={1}>
        {t('vista.history.unchanged')}
      </Text>
    )
  } else if (entry.resultChange === 'too-large') {
    change = (
      <Text muted size={1}>
        {t('vista.history.too-large')}
      </Text>
    )
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
          entry.reason.matchedTags.map((tag) => (
            <Badge fontSize={0} key={tag}>
              {tag}
            </Badge>
          ))}
        {change}
        <Box flexBasis="0%" flexGrow={1} />
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
        <Stack data-testid="vista-history-changes" gap={2} id={changesId} paddingTop={2}>
          <Flex alignItems="center" flexWrap="wrap" gap={2}>
            <Text muted size={1}>
              {t(
                previous.url === entry.url
                  ? 'vista.history.compared-with'
                  : 'vista.history.compared-with-other-request',
                {time: formatTime.format(new Date(previous.requestedAt))},
              )}
            </Text>
            {shown && !onlyHiddenChanged && (
              <>
                <Text data-testid="vista-history-hidden-fields" muted size={1}>
                  {t(showHidden ? 'vista.history.showing-hidden' : 'vista.history.hiding', {
                    fields: hiddenFields.join(', '),
                  })}
                </Text>
                <Button
                  data-testid="vista-history-hidden-toggle"
                  fontSize={1}
                  mode="bleed"
                  onClick={() => setShowHidden((value) => !value)}
                  padding={1}
                  text={t(showHidden ? 'vista.history.hide-hidden' : 'vista.history.show-hidden')}
                />
              </>
            )}
          </Flex>
          <ResultDiffBoundary
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
              <ResultDiffLoader
                next={diffed ? diffed.next : nextResult.value}
                previous={diffed ? diffed.previous : previousResult.value}
              />
            </Suspense>
          </ResultDiffBoundary>
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
