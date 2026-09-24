import {LaunchIcon} from '@sanity/icons/Launch'
import {UndoIcon} from '@sanity/icons/Undo'
import {Badge, Box, Button, Card, Text, TextArea} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {commitUrl, compareUrl} from '../trends/links'
import {type deriveBisectState} from './bisect'
import {CommandChip, InstallChip} from './chips'
import {CommitCard} from './CommitCard'
import {type TagSlice} from './data'
import {IncludedIn} from './IncludedIn'
import {withReproPath} from './reproPath'
import {type ResultAnnotations} from './sessions'
import {SEVERITIES, SEVERITY_LABEL, SEVERITY_TONE} from './severity'
import {pluralize} from './text'

/**
 * The verdict, rendered in place in the timeline: the first bad commit with
 * everything needed to act on it — reproduction (test studio, checkout,
 * install), classification (regression toggle, description), the suspect
 * range when the verdict is ambiguous, and the drill-down into it.
 */
export function ResultCard(props: {
  state: Extract<ReturnType<typeof deriveBisectState>, {kind: 'converged'}>
  releases: TagSlice[]
  /** Releases-only session — the suspects are untested by design, not unbuildable */
  releasesOnly?: boolean
  /** npm version if the first bad commit is itself a release */
  version?: string
  /** Session's repro path — the test studio link opens the preview build there */
  reproPath?: string
  annotations: ResultAnnotations
  onAnnotate: (patch: ResultAnnotations) => void
  /** Start a commit-granular session over the suspect range (releases-only drill-down) */
  onContinue?: () => void
  onUndo?: () => void
}) {
  const {
    state,
    releases,
    releasesOnly,
    version,
    reproPath,
    annotations,
    onAnnotate,
    onContinue,
    onUndo,
  } = props
  return (
    <CommitCard
      commit={state.firstBad}
      tone="critical"
      heading={
        <Flex alignItems="center" gap={2}>
          <Badge tone="critical" fontSize={0}>
            first bad commit
          </Badge>
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
      <Flex alignItems="center" gap={3} flexWrap="wrap">
        {state.firstBad.testStudioUrl && (
          <Button
            as="a"
            href={withReproPath(state.firstBad.testStudioUrl, reproPath)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open test studio (opens in a new tab)"
            tone="primary"
            icon={LaunchIcon}
            text="Open test studio"
          />
        )}
        {/* A clean verdict spans a single commit — a compare link adds nothing */}
        {state.suspects.length > 0 && (
          <Button
            as="a"
            href={compareUrl(state.lastGood.sha, state.firstBad.sha)}
            target="_blank"
            rel="noreferrer"
            aria-label="Compare on GitHub (opens in a new tab)"
            mode="ghost"
            icon={LaunchIcon}
            text={`Compare ${state.lastGood.sha.slice(0, 7)}…${state.firstBad.sha.slice(0, 7)}`}
          />
        )}
        <CommandChip command={`git checkout ${state.firstBad.sha.slice(0, 10)}`} />
        {version && <InstallChip version={version} />}
      </Flex>
      {/* stretch: the toggle matches the textarea's height */}
      <Flex gap={2} alignItems="stretch" flexWrap="wrap">
        <Box flex={1} style={{minWidth: 220}}>
          <TextArea
            rows={2}
            fontSize={1}
            placeholder="Describe the issue…"
            defaultValue={annotations.description ?? ''}
            onBlur={(event) => {
              const value = event.currentTarget.value.trim()
              if (value !== (annotations.description ?? '')) onAnnotate({description: value})
            }}
          />
        </Box>
        <Button
          mode={annotations.regression ? 'default' : 'ghost'}
          tone="critical"
          fontSize={1}
          text={annotations.regression ? 'Unmark as regression' : 'Mark as regression'}
          onClick={() => onAnnotate({regression: !annotations.regression})}
        />
      </Flex>
      {/* About the verdict rather than the issue: why this commit, the fix,
          a workaround. Same save-on-blur as the description */}
      <TextArea
        rows={2}
        fontSize={1}
        placeholder="Notes on the verdict — why this commit, the fix, a workaround…"
        defaultValue={annotations.note ?? ''}
        onBlur={(event) => {
          const value = event.currentTarget.value.trim()
          if (value !== (annotations.note ?? '')) onAnnotate({note: value})
        }}
      />
      {/* How bad — only meaningful once it IS a regression. Clicking the
          selected step clears it, so an unrated regression stays possible */}
      {annotations.regression && (
        <Flex alignItems="center" gap={2} flexWrap="wrap">
          <Text size={1} muted>
            Severity
          </Text>
          {SEVERITIES.map((severity) => {
            const selected = annotations.severity === severity
            return (
              <Button
                key={severity}
                mode={selected ? 'default' : 'ghost'}
                tone={SEVERITY_TONE[severity]}
                fontSize={0}
                padding={2}
                text={SEVERITY_LABEL[severity]}
                aria-pressed={selected}
                onClick={() => onAnnotate({severity: selected ? '' : severity})}
              />
            )
          })}
        </Flex>
      )}
      {state.suspects.length > 0 && (
        <Card padding={3} radius={2} tone="caution">
          <VStack gap={3}>
            <Text size={1} weight="semibold">
              {/* Two different reasons the range stays untested: a releases-only
                  session never proposes non-release commits (most have builds —
                  the drill-down below tests them), while in a commit-granular
                  session the only leftovers are genuinely untestable ones */}
              {pluralize(state.suspects.length, 'commit')}{' '}
              {releasesOnly
                ? `shipped between these releases and ${state.suspects.length === 1 ? 'was' : 'were'} not individually tested`
                : 'between last good and first bad had no testable preview build (skipped or never built)'}{' '}
              — any of these could be the culprit:
            </Text>
            {state.suspects.map((suspect) => (
              <Text key={suspect.sha} size={1}>
                <a href={commitUrl(suspect.sha)} target="_blank" rel="noreferrer">
                  <code>{suspect.sha.slice(0, 10)}</code> {suspect.subject}
                </a>
              </Text>
            ))}
            {onContinue && (
              <Flex>
                <Button
                  tone="primary"
                  fontSize={1}
                  text="Bisect these commits in a new session"
                  onClick={onContinue}
                />
              </Flex>
            )}
          </VStack>
        </Card>
      )}
    </CommitCard>
  )
}
