import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Card, Flex, MenuButton, Menu, MenuItem, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useDocumentStore} from 'sanity'

import {ackIsActive, clearAck, type DriftAck, DRIFT_ACK_QUERY, writeAck} from './acks'
import {formatValue, type TrendSeries} from './data'
import {computeDrift, type DriftBaseline, type DriftResult} from './drift'
import {backlinksFor} from './links'

const BASELINE_LABEL: Record<DriftBaseline['kind'], string> = {
  trailing: 'vs prior 3 weeks',
  step: 'vs same weekday',
}

const SNOOZE_DAYS = 7

function pct(fraction: number): string {
  const sign = fraction > 0 ? '+' : ''
  return `${sign}${(fraction * 100).toFixed(0)}%`
}

function worstOf(entry: DriftResult): DriftBaseline {
  return entry.fired.reduce((a, b) =>
    Math.abs(b.deltaFraction) > Math.abs(a.deltaFraction) ? b : a,
  )
}

function DriftRow(props: {
  entry: DriftResult
  showBranch: boolean
  acked: boolean
  onAck: (state: 'silenced' | 'snoozed' | 'fixed') => void
  onClear: () => void
}) {
  const {entry, showBranch, acked, onAck, onClear} = props
  const worst = worstOf(entry)
  return (
    <Flex align="center" gap={2} wrap="wrap">
      <Badge
        tone={entry.direction === 'regression' ? 'critical' : 'positive'}
        fontSize={0}
        mode="outline"
      >
        {entry.direction === 'regression' ? '↑ regression' : '↓ improvement'}
      </Badge>
      <Text size={1} weight="medium">
        {entry.title}
      </Text>
      {showBranch && (
        <Text size={1} muted>
          ({entry.branch})
        </Text>
      )}
      <Text size={1}>{pct(worst.deltaFraction)}</Text>
      <Text size={0} muted>
        {formatValue(worst.baseline, entry.unit)} → {formatValue(worst.recent, entry.unit)}
        {' · '}
        {entry.fired.map((f) => BASELINE_LABEL[f.kind]).join(', ')}
      </Text>
      {backlinksFor(entry.latest).map((link) => (
        <Box
          key={link.href}
          as="a"
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${link.label} (opens in a new tab)`}
        >
          <Badge fontSize={0} mode="outline" tone="primary">
            <Flex align="center" gap={1}>
              <LaunchIcon />
              {link.label}
            </Flex>
          </Badge>
        </Box>
      ))}
      <Box flex={1} />
      {acked ? (
        <Button mode="bleed" fontSize={0} padding={2} text="Un-ack" onClick={onClear} />
      ) : (
        <MenuButton
          id={`ack-${entry.seriesKey}-${entry.branch}`}
          button={<Button mode="bleed" fontSize={0} padding={2} text="Acknowledge" />}
          menu={
            <Menu>
              <MenuItem text="Silence" onClick={() => onAck('silenced')} />
              <MenuItem text={`Snooze ${SNOOZE_DAYS}d`} onClick={() => onAck('snoozed')} />
              <MenuItem text="Mark fixed" onClick={() => onAck('fixed')} />
            </Menu>
          }
          popover={{portal: true}}
        />
      )}
    </Flex>
  )
}

/**
 * "Changes to review" — metrics that drifted past the gate thresholds.
 * Regressions first; entries can be silenced / snoozed / marked fixed
 * (shared driftAck docs, realtime, half-lived). Acked entries collapse into
 * a reveal footer. Renders nothing when everything is steady and unacked.
 */
export function DriftFeed(props: {series: TrendSeries[]}) {
  const client = useClient({apiVersion: '2025-02-19'})
  const documentStore = useDocumentStore()
  const [showAcked, setShowAcked] = useState(false)

  const acks$ = useMemo(
    () =>
      documentStore.listenQuery(DRIFT_ACK_QUERY, {}, {tag: 'metrics.driftAcks'}).pipe(
        map((result) => result as DriftAck[]),
        catchError(() => of<DriftAck[]>([])),
      ),
    [documentStore],
  )
  const acks = useObservable(acks$, [])

  const drift = useMemo(() => computeDrift(props.series), [props.series])
  // Lazy initializer reads the clock once (runs outside render commit, so it
  // satisfies react-compiler purity); the interval refreshes it hourly, which
  // is plenty for day-scale ack expiry
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const {active, silenced} = useMemo(() => {
    const activeList: DriftResult[] = []
    const silencedList: DriftResult[] = []
    for (const entry of drift) {
      const ack = acks.find((a) => a.metricKey === entry.seriesKey && a.branch === entry.branch)
      const recent = worstOf(entry).recent
      if (ack && ackIsActive(ack, recent, now)) silencedList.push(entry)
      else activeList.push(entry)
    }
    return {active: activeList, silenced: silencedList}
  }, [drift, acks, now])

  if (active.length === 0 && silenced.length === 0) return null

  const regressions = active.filter((entry) => entry.direction === 'regression').length
  const showBranch = props.series.some((s) => s.lines.length > 1)

  const ackHandler = (entry: DriftResult, state: 'silenced' | 'snoozed' | 'fixed') => {
    void writeAck(client, {
      metricKey: entry.seriesKey,
      branch: entry.branch,
      baselineValue: worstOf(entry).recent,
      state,
      until:
        state === 'snoozed'
          ? new Date(now + SNOOZE_DAYS * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
    })
  }

  return (
    <Card
      tone={active.length === 0 ? 'default' : regressions > 0 ? 'caution' : 'positive'}
      border
      padding={3}
      radius={2}
    >
      <Stack space={3}>
        <Text size={1} weight="semibold">
          {active.length === 0
            ? 'No changes to review'
            : regressions > 0
              ? `${regressions} metric${regressions === 1 ? '' : 's'} to review`
              : `${active.length} improvement${active.length === 1 ? '' : 's'}`}
        </Text>
        {active.length > 0 && (
          <Stack space={2}>
            {active.map((entry) => (
              <DriftRow
                key={`${entry.seriesKey}:${entry.branch}`}
                entry={entry}
                showBranch={showBranch}
                acked={false}
                onAck={(state) => ackHandler(entry, state)}
                onClear={() => void clearAck(client, entry.seriesKey, entry.branch)}
              />
            ))}
          </Stack>
        )}
        {silenced.length > 0 && (
          <Stack space={2}>
            <Button
              mode="bleed"
              fontSize={0}
              padding={0}
              text={
                showAcked
                  ? `Hide ${silenced.length} acknowledged`
                  : `Show ${silenced.length} acknowledged`
              }
              onClick={() => setShowAcked((v) => !v)}
            />
            {showAcked &&
              silenced.map((entry) => (
                <DriftRow
                  key={`${entry.seriesKey}:${entry.branch}`}
                  entry={entry}
                  showBranch={showBranch}
                  acked
                  onAck={(state) => ackHandler(entry, state)}
                  onClear={() => void clearAck(client, entry.seriesKey, entry.branch)}
                />
              ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
