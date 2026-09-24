import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PlayIcon} from '@sanity/icons/Play'
import {UndoIcon} from '@sanity/icons/Undo'
import {Badge, type BadgeTone, Box, Button, Card, Text} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'
import {Flex, VStack} from 'ui5'

import {commitUrl, compareUrl} from '../trends/links'
import {AuthorAvatar} from './AuthorAvatar'
import {
  type BisectCommit,
  type deriveBisectState,
  pickableShas,
  type TimelineEntry,
  type TimelineRole,
  type Verdict,
} from './bisect'
import {CommandChip, InstallChip} from './chips'
import {CommitCard} from './CommitCard'
import {type TagSlice} from './data'
import {IncludedIn} from './IncludedIn'
import {withReproPath} from './reproPath'
import {ResultCard} from './ResultCard'
import {type ResultAnnotations} from './sessions'
import {pluralize} from './text'

interface RowBadge {
  tone: BadgeTone
  label: string
}

const TIMELINE_ROLE: Record<TimelineRole, RowBadge> = {
  current: {tone: 'primary', label: 'you are here'},
  good: {tone: 'positive', label: 'good'},
  bad: {tone: 'critical', label: 'bad'},
  skip: {tone: 'default', label: 'skipped'},
}

const GAP_ZONE: Record<'bad' | 'unknown' | 'good', RowBadge> = {
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
 *
 * Gaps expand in place to list their commits, and any listed or visited
 * commit can be picked for testing out of turn (see `pickableShas` for the
 * exclusions): it renders the same card as the proposed step, and its mark
 * joins the same log. The pick is local UI state — a mark reshapes the map, so a pick whose
 * row is no longer visible simply lapses instead of being synced.
 */
export function Timeline(props: {
  entries: TimelineEntry[]
  onMark: (sha: string, verdict: Verdict) => void
  onUndo?: () => void
  /** From the active state — shown on the current step's badge. */
  stepsLeft?: number
  /** Releases whose ancestry contains a commit — shown on every test card. */
  releasesFor: (sha: string) => TagSlice[]
  versionBySha?: Map<string, string>
  /** Session's repro path — every "Open test studio" link opens the preview build there. */
  reproPath?: string
  converged?: {
    state: Extract<ReturnType<typeof deriveBisectState>, {kind: 'converged'}>
    releases: TagSlice[]
    /** Releases-only session — the suspects are untested by design, not unbuildable */
    releasesOnly?: boolean
    annotations: ResultAnnotations
    onAnnotate: (patch: ResultAnnotations) => void
    onContinue?: () => void
  }
}) {
  const {entries, onMark, onUndo, stepsLeft, releasesFor, versionBySha, reproPath, converged} =
    props
  const [expandedGaps, setExpandedGaps] = useState<ReadonlySet<string>>(() => new Set())
  const [pickedSha, setPickedSha] = useState<string>()

  // Only a commit with a visible row can stay picked. Marks reshape the map
  // (a gap that splits gets new keys and collapses), so derive the effective
  // pick from what is rendered rather than syncing state to the entries.
  const verdictSha = converged?.state.firstBad.sha
  const pickable = useMemo(
    () => pickableShas(entries, expandedGaps, {verdictSha}),
    [entries, expandedGaps, verdictSha],
  )
  const picked = pickedSha && pickable.has(pickedSha) ? pickedSha : undefined

  const toggleGap = (newestSha: string) => {
    setExpandedGaps((current) => {
      const next = new Set(current)
      if (next.has(newestSha)) next.delete(newestSha)
      else next.add(newestSha)
      return next
    })
  }
  const mark = (sha: string, verdict: Verdict) => {
    setPickedSha(undefined)
    onMark(sha, verdict)
  }
  const cancelPick = () => setPickedSha(undefined)

  const pickedCard = (commit: BisectCommit) => (
    <TestCard
      key={commit.sha}
      commit={commit}
      heading={{kind: 'picked', onCancel: cancelPick}}
      releasesFor={releasesFor}
      version={versionBySha?.get(commit.sha)}
      reproPath={reproPath}
      onMark={mark}
    />
  )

  return (
    <VStack gap={2}>
      <Text size={1} weight="semibold">
        Bisect timeline
      </Text>
      <VStack gap={1}>
        {entries.map((entry) => {
          if (entry.kind === 'gap') {
            const expanded = expandedGaps.has(entry.newestSha)
            return (
              <GapGroup
                key={`gap-${entry.newestSha}`}
                entry={entry}
                expanded={expanded}
                onToggle={() => toggleGap(entry.newestSha)}
              >
                {expanded &&
                  entry.commits.map((commit) =>
                    picked === commit.sha ? (
                      pickedCard(commit)
                    ) : (
                      <CommitRow
                        key={commit.sha}
                        commit={commit}
                        badge={GAP_ZONE[entry.zone]}
                        onPick={() => setPickedSha(commit.sha)}
                      />
                    ),
                  )}
              </GapGroup>
            )
          }
          const {commit} = entry
          if (picked === commit.sha) return pickedCard(commit)
          if (converged && commit.sha === converged.state.firstBad.sha) {
            return (
              <ResultCard
                key={commit.sha}
                state={converged.state}
                releases={converged.releases}
                releasesOnly={converged.releasesOnly}
                version={versionBySha?.get(commit.sha)}
                reproPath={reproPath}
                annotations={converged.annotations}
                onAnnotate={converged.onAnnotate}
                onContinue={converged.onContinue}
                onUndo={onUndo}
              />
            )
          }
          if (entry.role === 'current') {
            return (
              <TestCard
                key={commit.sha}
                commit={commit}
                heading={{kind: 'next', stepsLeft, onUndo}}
                releasesFor={releasesFor}
                version={versionBySha?.get(commit.sha)}
                reproPath={reproPath}
                onMark={mark}
              />
            )
          }
          return (
            <CommitRow
              key={commit.sha}
              commit={commit}
              badge={TIMELINE_ROLE[entry.role]}
              onPick={pickable.has(commit.sha) ? () => setPickedSha(commit.sha) : undefined}
            />
          )
        })}
      </VStack>
    </VStack>
  )
}

/** A collapsed run: the toggle row, then (when expanded) its commits, inset. */
function GapGroup(props: {
  entry: Extract<TimelineEntry, {kind: 'gap'}>
  expanded: boolean
  onToggle: () => void
  children?: ReactNode
}) {
  const {entry, expanded, onToggle, children} = props
  return (
    <VStack gap={1}>
      <Card padding={2} radius={2} tone="neutral">
        <Flex alignItems="center" gap={2}>
          <Box style={{width: 96, flexShrink: 0}}>
            <Badge tone={GAP_ZONE[entry.zone].tone} fontSize={0}>
              {GAP_ZONE[entry.zone].label}
            </Badge>
          </Box>
          <Button
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            text={pluralize(entry.count, 'commit')}
            aria-expanded={expanded}
            onClick={onToggle}
          />
          <Box flex={1} />
          <Text size={1} muted>
            <a href={compareUrl(entry.baseSha, entry.newestSha)} target="_blank" rel="noreferrer">
              Compare on GitHub
            </a>
          </Text>
        </Flex>
      </Card>
      {expanded && (
        <Box paddingLeft={4}>
          <VStack gap={1}>{children}</VStack>
        </Box>
      )}
    </VStack>
  )
}

/**
 * The interactive card for one commit: open its preview build at the repro
 * path, checkout/install chips, and the good/bad/skip verdict. Rendered for
 * the proposed step and for any commit picked out of turn — same card, the
 * heading is the only difference.
 */
function TestCard(props: {
  commit: BisectCommit
  heading:
    | {kind: 'next'; stepsLeft?: number; onUndo?: () => void}
    | {kind: 'picked'; onCancel: () => void}
  releasesFor: (sha: string) => TagSlice[]
  version?: string
  reproPath?: string
  onMark: (sha: string, verdict: Verdict) => void
}) {
  const {commit, heading, releasesFor, version, reproPath, onMark} = props
  // Walks every tag's ancestry — memoized per commit, not per timeline render
  const releases = useMemo(() => releasesFor(commit.sha), [releasesFor, commit.sha])
  const headingText =
    heading.kind === 'picked'
      ? `Testing ${commit.sha.slice(0, 7)} out of turn`
      : heading.stepsLeft === undefined
        ? 'Next commit to test'
        : `Next commit to test (${pluralize(heading.stepsLeft, 'commit')} left)`
  return (
    <CommitCard
      commit={commit}
      tone="primary"
      heading={
        <Flex alignItems="center" gap={2}>
          <Text size={1} weight="semibold">
            {headingText}
          </Text>
          <Box flex={1} />
          {heading.kind === 'picked' ? (
            <Button mode="bleed" fontSize={1} text="Cancel" onClick={heading.onCancel} />
          ) : (
            heading.onUndo && (
              <Button
                mode="bleed"
                fontSize={1}
                icon={UndoIcon}
                text="Undo previous mark"
                onClick={heading.onUndo}
              />
            )
          )}
        </Flex>
      }
    >
      <IncludedIn releases={releases} />
      {!commit.testStudioUrl && (
        <Text size={1} muted>
          No preview build for this commit — test it from a checkout instead.
        </Text>
      )}
      <Flex alignItems="center" gap={3} flexWrap="wrap">
        {commit.testStudioUrl && (
          <Button
            as="a"
            href={withReproPath(commit.testStudioUrl, reproPath)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open test studio (opens in a new tab)"
            tone="primary"
            icon={LaunchIcon}
            text="Open test studio"
          />
        )}
        <CommandChip command={`git checkout ${commit.sha.slice(0, 10)}`} />
        {version && <InstallChip version={version} />}
        <Box flex={1} />
        <Flex alignItems="center" gap={2}>
          <Text size={1} muted>
            Mark as
          </Text>
          <Button
            mode="ghost"
            tone="positive"
            fontSize={1}
            icon={CheckmarkIcon}
            text="Good"
            onClick={() => onMark(commit.sha, 'good')}
          />
          <Button
            mode="ghost"
            tone="critical"
            fontSize={1}
            icon={CloseIcon}
            text="Bad"
            onClick={() => onMark(commit.sha, 'bad')}
          />
          <Button
            mode="ghost"
            fontSize={1}
            text="Skip"
            onClick={() => onMark(commit.sha, 'skip')}
          />
        </Flex>
      </Flex>
    </CommitCard>
  )
}

function CommitRow(props: {commit: BisectCommit; badge: RowBadge; onPick?: () => void}) {
  const {commit, badge, onPick} = props
  return (
    <Card padding={2} radius={2}>
      <Flex alignItems="center" gap={2}>
        <Box style={{width: 96, flexShrink: 0}}>
          <Badge tone={badge.tone} fontSize={0}>
            {badge.label}
          </Badge>
        </Box>
        <AuthorAvatar
          name={commit.authorName}
          email={commit.authorEmail}
          login={commit.authorLogin}
          avatarUrl={commit.authorAvatarUrl}
        />
        <Text size={1}>
          <a href={commitUrl(commit.sha)} target="_blank" rel="noreferrer">
            <code>{commit.sha.slice(0, 7)}</code>
          </a>
        </Text>
        <Box flex={1} style={{minWidth: 0}}>
          <Text size={1} muted textOverflow="ellipsis">
            <a href={commitUrl(commit.sha)} target="_blank" rel="noreferrer">
              {commit.subject}
            </a>
          </Text>
        </Box>
        {onPick && (
          <Button
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={PlayIcon}
            text="Test"
            aria-label={`Test ${commit.sha.slice(0, 7)}`}
            onClick={onPick}
          />
        )}
      </Flex>
    </Card>
  )
}
