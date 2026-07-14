import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Card, Flex, MenuButton, Menu, MenuItem, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {formatValue} from './data'
import {type DriftBaseline, type DriftResult} from './drift'
import {backlinksFor} from './links'
import {type DriftState, worstOf} from './useDriftState'

const BASELINE_LABEL: Record<DriftBaseline['kind'], string> = {
  trailing: 'vs prior 3 weeks',
  step: 'vs same weekday',
}

const SNOOZE_DAYS = 7

function pct(fraction: number): string {
  const sign = fraction > 0 ? '+' : ''
  return `${sign}${(fraction * 100).toFixed(0)}%`
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
              {/* "Mark fixed" only for regressions — an improvement has nothing
                  to fix */}
              {entry.direction === 'regression' && (
                <MenuItem text="Mark fixed" onClick={() => onAck('fixed')} />
              )}
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
export function DriftFeed(props: {drift: DriftState; showBranch: boolean}) {
  const {drift, showBranch} = props
  const {active, silenced, regressionCount} = drift
  // Collapsed by default now that each tab carries its own review-count badge —
  // this bar is the roll-up you expand for the details (which metric, how much,
  // and the ack controls).
  const [expanded, setExpanded] = useState(false)
  const [showAcked, setShowAcked] = useState(false)

  if (active.length === 0 && silenced.length === 0) return null

  const summary =
    active.length === 0
      ? 'No changes to review'
      : regressionCount > 0
        ? `${regressionCount} metric${regressionCount === 1 ? '' : 's'} to review`
        : `${active.length} improvement${active.length === 1 ? '' : 's'}`

  return (
    <Card
      tone={active.length === 0 ? 'default' : regressionCount > 0 ? 'caution' : 'positive'}
      border
      padding={3}
      radius={2}
    >
      <Stack space={expanded ? 3 : 0}>
        {/* The whole header row is the expander */}
        <Button
          mode="bleed"
          padding={0}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <Flex align="center" gap={2} paddingY={1}>
            {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            <Text size={1} weight="semibold">
              {summary}
            </Text>
          </Flex>
        </Button>

        {expanded && active.length > 0 && (
          <Stack space={2}>
            {active.map((entry) => (
              <DriftRow
                key={`${entry.seriesKey}:${entry.branch}`}
                entry={entry}
                showBranch={showBranch}
                acked={false}
                onAck={(state) => drift.ack(entry, state)}
                onClear={() => drift.clear(entry)}
              />
            ))}
          </Stack>
        )}
        {expanded && silenced.length > 0 && (
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
                  onAck={(state) => drift.ack(entry, state)}
                  onClear={() => drift.clear(entry)}
                />
              ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
