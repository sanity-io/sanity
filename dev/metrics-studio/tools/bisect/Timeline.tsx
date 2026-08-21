import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import {UndoIcon} from '@sanity/icons/Undo'
import {Badge, type BadgeTone, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'

import {commitUrl, compareUrl} from '../trends/links'
import {AuthorAvatar} from './AuthorAvatar'
import {type deriveBisectState, type TimelineEntry, type TimelineRole, type Verdict} from './bisect'
import {CommandChip, InstallChip} from './chips'
import {CommitCard} from './CommitCard'
import {type TagSlice} from './data'
import {IncludedIn} from './IncludedIn'
import {ResultCard} from './ResultCard'
import {type ResultAnnotations} from './sessions'
import {pluralize} from './text'

const TIMELINE_ROLE: Record<TimelineRole, {tone: BadgeTone; label: string}> = {
  current: {tone: 'primary', label: 'you are here'},
  good: {tone: 'positive', label: 'good'},
  bad: {tone: 'critical', label: 'bad'},
  skip: {tone: 'default', label: 'skipped'},
}

const GAP_ZONE: Record<'bad' | 'unknown' | 'good', {tone: BadgeTone; label: string}> = {
  bad: {tone: 'critical', label: 'bad'},
  unknown: {tone: 'default', label: 'untested'},
  good: {tone: 'positive', label: 'good'},
}

/**
 * The session map, newest commit first: endpoints, bounds, visited commits,
 * with collapsed runs in between (labelled by what the bisect already
 * deduced about them, linking to the GitHub compare of the span). The commit
 * under test renders in place as the full interactive card — "you are here"
 * IS the next step — and the verdict renders in place the same way.
 */
export function Timeline(props: {
  entries: TimelineEntry[]
  onMark: (sha: string, verdict: Verdict) => void
  onUndo?: () => void
  /** From the active state — shown on the current step's badge. */
  stepsLeft?: number
  currentReleases?: TagSlice[]
  versionBySha?: Map<string, string>
  converged?: {
    state: Extract<ReturnType<typeof deriveBisectState>, {kind: 'converged'}>
    releases: TagSlice[]
    annotations: ResultAnnotations
    onAnnotate: (patch: ResultAnnotations) => void
    onContinue?: () => void
  }
}) {
  const {entries, onMark, onUndo, stepsLeft, currentReleases, versionBySha, converged} = props
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        Bisect timeline
      </Text>
      <Stack gap={1}>
        {entries.map((entry) =>
          entry.kind === 'gap' ? (
            <GapRow key={`gap-${entry.newestSha}`} entry={entry} />
          ) : converged && entry.commit.sha === converged.state.firstBad.sha ? (
            <ResultCard
              key={entry.commit.sha}
              state={converged.state}
              releases={converged.releases}
              version={versionBySha?.get(entry.commit.sha)}
              annotations={converged.annotations}
              onAnnotate={converged.onAnnotate}
              onContinue={converged.onContinue}
              onUndo={onUndo}
            />
          ) : entry.role === 'current' ? (
            <CurrentStepCard
              key={entry.commit.sha}
              entry={entry}
              stepsLeft={stepsLeft}
              releases={currentReleases ?? []}
              version={versionBySha?.get(entry.commit.sha)}
              onMark={onMark}
              onUndo={onUndo}
            />
          ) : (
            <CommitRow key={entry.commit.sha} entry={entry} />
          ),
        )}
      </Stack>
    </Stack>
  )
}

function GapRow(props: {entry: Extract<TimelineEntry, {kind: 'gap'}>}) {
  const {entry} = props
  return (
    <Card padding={2} radius={2} tone="neutral">
      <Flex align="center" gap={2}>
        <Box style={{width: 96, flexShrink: 0}}>
          <Badge tone={GAP_ZONE[entry.zone].tone} fontSize={0}>
            {GAP_ZONE[entry.zone].label}
          </Badge>
        </Box>
        <Text size={1} muted>
          <StackCompactIcon />
        </Text>
        <Box flex={1} style={{minWidth: 0}}>
          <Text size={1} muted>
            <a href={compareUrl(entry.baseSha, entry.newestSha)} target="_blank" rel="noreferrer">
              {pluralize(entry.count, 'commit')}
            </a>
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}

function CurrentStepCard(props: {
  entry: Extract<TimelineEntry, {kind: 'commit'}>
  stepsLeft?: number
  releases: TagSlice[]
  version?: string
  onMark: (sha: string, verdict: Verdict) => void
  onUndo?: () => void
}) {
  const {entry, stepsLeft, releases, version, onMark, onUndo} = props
  return (
    <CommitCard
      commit={entry.commit}
      tone="primary"
      heading={
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">
            Next commit to test
            {stepsLeft === undefined ? '' : ` (${pluralize(stepsLeft, 'commit')} left)`}
          </Text>
          <Box flex={1} />
          {onUndo && (
            <Button
              mode="bleed"
              fontSize={1}
              icon={UndoIcon}
              text="Undo previous mark"
              onClick={onUndo}
            />
          )}
        </Flex>
      }
    >
      <IncludedIn releases={releases} />
      <Flex align="center" gap={3} wrap="wrap">
        <Button
          as="a"
          href={entry.commit.testStudioUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open test studio (opens in a new tab)"
          tone="primary"
          icon={LaunchIcon}
          text="Open test studio"
        />
        <CommandChip command={`git checkout ${entry.commit.sha.slice(0, 10)}`} />
        {version && <InstallChip version={version} />}
        <Box flex={1} />
        <Flex align="center" gap={2}>
          <Text size={1} muted>
            Mark as
          </Text>
          <Button
            mode="ghost"
            tone="positive"
            fontSize={1}
            icon={CheckmarkIcon}
            text="Good"
            onClick={() => onMark(entry.commit.sha, 'good')}
          />
          <Button
            mode="ghost"
            tone="critical"
            fontSize={1}
            icon={CloseIcon}
            text="Bad"
            onClick={() => onMark(entry.commit.sha, 'bad')}
          />
          <Button
            mode="ghost"
            fontSize={1}
            text="Skip"
            onClick={() => onMark(entry.commit.sha, 'skip')}
          />
        </Flex>
      </Flex>
    </CommitCard>
  )
}

function CommitRow(props: {entry: Extract<TimelineEntry, {kind: 'commit'}>}) {
  const {entry} = props
  return (
    <Card padding={2} radius={2}>
      <Flex align="center" gap={2}>
        <Box style={{width: 96, flexShrink: 0}}>
          <Badge tone={TIMELINE_ROLE[entry.role].tone} fontSize={0}>
            {TIMELINE_ROLE[entry.role].label}
          </Badge>
        </Box>
        <AuthorAvatar
          name={entry.commit.authorName}
          email={entry.commit.authorEmail}
          login={entry.commit.authorLogin}
          avatarUrl={entry.commit.authorAvatarUrl}
        />
        <Text size={1}>
          <a href={commitUrl(entry.commit.sha)} target="_blank" rel="noreferrer">
            <code>{entry.commit.sha.slice(0, 7)}</code>
          </a>
        </Text>
        <Box flex={1} style={{minWidth: 0}}>
          <Text size={1} muted textOverflow="ellipsis">
            <a href={commitUrl(entry.commit.sha)} target="_blank" rel="noreferrer">
              {entry.commit.subject}
            </a>
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
