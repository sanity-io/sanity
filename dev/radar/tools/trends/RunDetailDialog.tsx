import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RobotIcon} from '@sanity/icons/Robot'
import {Badge, Button, Dialog, Stack, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {useIntentLink} from 'sanity/router'
import {Box, Flex, Grid} from 'ui5'

import {messageToPlainText, threadsForSha} from '../comments/comments'
import {useCommitComments} from '../comments/CommitCommentsContext'
import {CommitCommentsPanel} from '../comments/CommitCommentsPanel'
import {
  CALIBRATION_EXPLAINER,
  formatValue,
  INP_MIN_INTERACTIONS,
  releaseContextAt,
  type TrendPoint,
  type TrendSeries,
  type TrendTag,
} from './data'
import {buildInvestigationPrompt} from './investigationPrompt'
import {abDispatchCommand, backlinksFor, compareUrl, sourceFileUrl} from './links'

const FULL_SHA = /^[0-9a-f]{40}$/i

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Clipboard write with feedback that lives on the button itself (label + icon
 * flip) rather than a toast — the dialog is compact enough that the change is
 * right under the cursor, and a failure is just as visible. Resets after 2s.
 */
function useCopyFeedback(): {state: CopyState; copy: (text: string) => void} {
  const [state, setState] = useState<CopyState>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(resetTimer.current), [])
  const copy = (text: string) => {
    const finish = (next: 'copied' | 'failed') => {
      setState(next)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setState('idle'), 2000)
    }
    // navigator.clipboard is undefined outside secure contexts, where the
    // call would throw synchronously instead of rejecting
    try {
      navigator.clipboard.writeText(text).then(
        () => finish('copied'),
        () => finish('failed'),
      )
    } catch {
      finish('failed')
    }
  }
  return {state, copy}
}

/**
 * Details for one run, shown in a dialog. Summarizes the value, gathers every
 * backlink (PR / commit / CI run) in one place, carries the investigation
 * hand-offs and the commit's comment threads, and offers a jump to the raw
 * benchRun document — more useful than navigating straight to the document,
 * and it works regardless of studio routing quirks.
 *
 * A dialog rather than a popover anchored at the clicked point: the panel's
 * height changes after it opens (comments load, a thread expands, the
 * composer grows), and a popover re-positions itself around its anchor on
 * every change, so the whole panel jumped while it was being read. A centred
 * dialog stays put and grows downward. Dialog also owns the dismissal —
 * Escape, click outside, the close button — and guards it by the layer stack,
 * so the comment UI's own popovers and dialogs (the @mention picker, the
 * delete confirm) can open on top without closing the run behind them.
 */
export function RunDetailDialog(props: {
  series: TrendSeries
  point: TrendPoint
  /** The nearest earlier point on the same line measuring a distinct commit. */
  previousPoint?: TrendPoint
  /** Stable main-branch release tags — for this run's release context. */
  tags?: TrendTag[]
  onClose: () => void
}) {
  const {series, point, previousPoint, tags = [], onClose} = props
  const {host} = point
  // The branch this run measured — only main commits have a gitCommit
  // document for comments to hang on. Matched by run id, not object identity:
  // the series are rebuilt on every realtime emit, so the point this dialog
  // holds stops being the object in `series.lines` while the dialog is open
  const branch =
    series.lines.find((line) => line.points.some((candidate) => candidate.runId === point.runId))
      ?.branch ?? 'unknown'
  // Which releases this run sits between. Always stated when known, unlike the
  // hover tooltip's proximity-based row: "which release is this run's code in?"
  // is a question every run has an answer to. Meaningless on soak minute charts,
  // whose x-axis is elapsed minutes rather than a calendar date.
  // A release run measured the tagged commit itself, so it needs no bracket:
  // its value *is* that release's number. The bracket stays for ordinary runs,
  // where sitting between two releases is the strongest true statement.
  const releaseContext =
    series.xKind === 'minute' || point.releaseTag
      ? {}
      : releaseContextAt(tags, point.date.getTime())
  const measuredTag = series.xKind === 'minute' ? undefined : point.releaseTag
  // "What landed between this point and the previous one?" — the GitHub
  // compare view answers it directly. Guarded by the full-sha shape so a
  // 'unknown' or malformed sha never builds a dead link.
  const compareHref =
    previousPoint && FULL_SHA.test(previousPoint.sha) && FULL_SHA.test(point.sha)
      ? compareUrl(previousPoint.sha, point.sha)
      : undefined
  const documentLink = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
  // Two copy affordances share the previous point as `ab_from`: the bare
  // dispatch command (for someone who already knows what they suspect) and
  // the full investigation brief for a coding agent. Each keeps its own
  // feedback state so copying one never relabels the other.
  const abCopy = useCopyFeedback()
  const promptCopy = useCopyFeedback()
  // The bench workflow's ab_from/ab_to inputs require full shas, and GitHub
  // has no URL that prefills a workflow_dispatch form — so the affordance is
  // a copyable command, previous point as reference, this point as experiment
  const abCommand =
    previousPoint && FULL_SHA.test(previousPoint.sha) && FULL_SHA.test(point.sha)
      ? abDispatchCommand(previousPoint.sha, point.sha)
      : undefined
  const backlinks = backlinksFor(point)
  // The scenario source *as it ran for this commit* — pinning to the run's sha
  // (not main) shows exactly the definition that produced this point, since
  // scenarios evolve over time. Omitted when the sha is unknown (local runs).
  const scenarioHref =
    series.sourceFile && point.sha !== 'unknown'
      ? sourceFileUrl(series.sourceFile, point.sha)
      : undefined
  const when =
    series.xKind === 'minute'
      ? `minute ${Math.round(point.date.getTime() / 60_000)} of the run`
      : point.date.toISOString().slice(0, 10)

  // The comment threads on this commit, as plain text for the investigation
  // prompt — an agent should build on what people already found
  const promptComments = threadsForSha(useCommitComments(), point.sha, series.key).map(
    (thread) => ({
      createdAt: thread.createdAt,
      text: messageToPlainText(thread.message),
    }),
  )

  return (
    // width 1 (640px): room for the two-column context block and the comment
    // threads without the composer wrapping. Dialog owns Escape, the close
    // button in its header, the focus trap and click-outside.
    <Dialog
      id={`run-detail-${point.runId}`}
      header={series.title}
      width={1}
      onClose={onClose}
      onClickOutside={onClose}
    >
      <Box padding={4}>
        <Stack gap={4}>
          {/* The headline: the value and its date on the left, the
                percentiles as a labelled stat row on the right — one line of
                "what was measured", read left to right from the number to its
                spread. Below it, the links that identify the run (commit, PR,
                CI run, scenario source): chips, no eyebrow — each names itself. */}
          <Stack gap={3}>
            <Flex alignItems="flex-end" justifyContent="space-between" gap={4} flexWrap="wrap">
              <Stack gap={2}>
                <Text size={4} weight="semibold">
                  {formatValue(point.value, series.unit)}
                </Text>
                <Text size={1} muted>
                  {when}
                </Text>
              </Stack>
              {(point.p75 !== undefined || point.p90 !== undefined) && (
                <Flex gap={4}>
                  <Stack gap={2}>
                    <Text size={0} muted>
                      p75
                    </Text>
                    <Text size={1}>{formatValue(point.p75 ?? point.value, series.unit)}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size={0} muted>
                      p90
                    </Text>
                    <Text size={1}>{formatValue(point.p90 ?? point.value, series.unit)}</Text>
                  </Stack>
                  {point.interactions !== undefined && (
                    <Stack gap={2}>
                      <Text size={0} muted>
                        interactions
                      </Text>
                      <Text size={1}>{point.interactions}</Text>
                    </Stack>
                  )}
                </Flex>
              )}
            </Flex>
            {/* An INP from too few interactions is a weak estimate — say so
                  where the number is read, not in a separate chart */}
            {point.interactions !== undefined && point.interactions < INP_MIN_INTERACTIONS && (
              <Badge tone="caution" fontSize={0}>
                Low confidence: only {point.interactions} interactions (a reliable INP needs{' '}
                {INP_MIN_INTERACTIONS})
              </Badge>
            )}
            {(backlinks.length > 0 || scenarioHref) && (
              <Flex gap={2} flexWrap="wrap">
                {backlinks.map((link) => (
                  <Button
                    key={link.href}
                    as="a"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${link.label} (opens in a new tab)`}
                    mode="ghost"
                    fontSize={1}
                    padding={2}
                    icon={LaunchIcon}
                    text={link.label}
                  />
                ))}
                {scenarioHref && (
                  <Button
                    as="a"
                    href={scenarioHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Scenario source at this commit (opens in a new tab)`}
                    mode="ghost"
                    fontSize={1}
                    padding={2}
                    icon={LaunchIcon}
                    text="Scenario"
                  />
                )}
              </Flex>
            )}
          </Stack>

          {/* Context, side by side: where the run sits among releases, and
                the machine that measured it. Two short label/value lists that
                are read together ("is this a real step, or a slower host after
                a release?"), so they share a row rather than stacking. */}
          {(measuredTag ||
            releaseContext.previous ||
            releaseContext.next ||
            host ||
            point.calibrationMs !== undefined) && (
            <Grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
              {/* Where this run sits in the release timeline. Stated for
                    every run (not only ones next to a marker), because "is this
                    before or after the release I care about?" is the question
                    the markers raise and the dialog is where it gets answered.

                    Wording is careful: "released in" would claim commit
                    containment, which a by-date bound does not establish — so
                    it says "after" / "before", which is exactly what the dates
                    support. A release run measured the tagged commit itself —
                    the one case where a number attributes to a shipped version
                    — and says "released as" instead of bracketing. */}
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Release
                </Text>
                {measuredTag ? (
                  <Stack gap={2}>
                    <Flex alignItems="center" gap={2}>
                      <Text size={1} muted>
                        released as
                      </Text>
                      <Text size={1} weight="semibold">
                        {measuredTag}
                      </Text>
                    </Flex>
                    <Text size={0} muted>
                      This run measured the release commit.
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap={2}>
                    {releaseContext.previous && (
                      <Flex alignItems="center" gap={2}>
                        <Text size={1} muted>
                          after
                        </Text>
                        <Text size={1}>{releaseContext.previous.tag}</Text>
                        {releaseContext.previous.distTags?.includes('latest') && (
                          <Badge tone="primary" fontSize={0}>
                            latest
                          </Badge>
                        )}
                      </Flex>
                    )}
                    {releaseContext.next ? (
                      <Flex alignItems="center" gap={2}>
                        <Text size={1} muted>
                          before
                        </Text>
                        <Text size={1}>{releaseContext.next.tag}</Text>
                      </Flex>
                    ) : (
                      // The common case for recent runs, and worth saying out
                      // loud: silence here would read as missing data
                      <Text size={1} muted>
                        not yet released
                      </Text>
                    )}
                    {!releaseContext.previous && !releaseContext.next && (
                      <Text size={1} muted>
                        no release context
                      </Text>
                    )}
                  </Stack>
                )}
              </Stack>

              {/* The machine that produced this run — the context every
                    absolute number depends on. cpuModel/image/browser exist on
                    documents from Aug 2026 on; older runs show what they
                    recorded. */}
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Host
                </Text>
                <Stack gap={2}>
                  {point.calibrationMs !== undefined && (
                    <Flex alignItems="center" gap={2} title={CALIBRATION_EXPLAINER}>
                      <Text size={1} muted>
                        calibration
                      </Text>
                      <Text size={1}>{formatValue(point.calibrationMs, 'ms')}</Text>
                    </Flex>
                  )}
                  {host?.cpuModel && (
                    <Text size={1} muted>
                      {host.cpuModel}
                    </Text>
                  )}
                  {host && (host.os || host.cpus !== undefined || host.memGb !== undefined) && (
                    <Text size={1} muted>
                      {[
                        host.os && (host.arch ? `${host.os}/${host.arch}` : host.os),
                        host.cpus !== undefined ? `${host.cpus} cores` : undefined,
                        host.memGb !== undefined ? `${host.memGb} GB RAM` : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                  {(host?.browserVersion || host?.nodeVersion) && (
                    <Text size={1} muted>
                      {[
                        host.browserVersion ? `Chromium ${host.browserVersion}` : undefined,
                        host.nodeVersion ? `Node ${host.nodeVersion}` : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                  {(host?.imageOs || host?.imageVersion) && (
                    <Text size={1} muted>
                      image {[host.imageOs, host.imageVersion].filter(Boolean).join(' ')}
                    </Text>
                  )}
                  {!host && point.calibrationMs === undefined && (
                    <Text size={1} muted>
                      not recorded
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Grid>
          )}

          {compareHref && (
            <Stack gap={2}>
              <Text size={0} muted weight="medium">
                Suspect a regression?
              </Text>
              {/* Three hand-offs on one row (wrapping when a copy label
                    lengthens): the compare view, the bare A/B dispatch, and
                    the full brief. Stacked full-width they read as a menu. */}
              <Flex gap={2} flexWrap="wrap">
                <Button
                  as="a"
                  href={compareHref}
                  target="_blank"
                  rel="noreferrer"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  icon={LaunchIcon}
                  text="Compare with previous run"
                  aria-label="GitHub compare view of the commits between the previous run's commit and this one (opens in a new tab)"
                />
                {/* The bare dispatch command — previous point as reference,
                      this point as experiment — for a human who knows what they
                      suspect and just wants the run going. The command doubles
                      as the tooltip so a denied clipboard is still recoverable. */}
                {abCommand && (
                  <Button
                    mode="ghost"
                    fontSize={1}
                    padding={2}
                    icon={abCopy.state === 'copied' ? CheckmarkIcon : CopyIcon}
                    tone={abCopy.state === 'copied' ? 'positive' : 'default'}
                    text={
                      abCopy.state === 'copied'
                        ? 'Copied — paste in a terminal'
                        : abCopy.state === 'failed'
                          ? 'Copy failed — command in tooltip'
                          : 'Copy A/B vs previous run'
                    }
                    title={abCommand}
                    aria-label="Copy the gh command dispatching an A/B bench comparison of this commit against the previous run's commit"
                    onClick={() => abCopy.copy(abCommand)}
                  />
                )}
                {/* A paste-ready brief for a coding agent: the full signal
                      (metric, both commits, delta, backlinks, existing comments)
                      plus the A/B dispatch / bisect recipe from perf/bench/README.md */}
                <Button
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  icon={promptCopy.state === 'copied' ? CheckmarkIcon : RobotIcon}
                  tone={promptCopy.state === 'copied' ? 'positive' : 'default'}
                  text={
                    promptCopy.state === 'copied'
                      ? 'Copied'
                      : promptCopy.state === 'failed'
                        ? 'Copy failed'
                        : 'Copy investigation prompt'
                  }
                  aria-label="Copy an investigation brief for a coding agent to the clipboard"
                  onClick={() =>
                    previousPoint &&
                    promptCopy.copy(
                      buildInvestigationPrompt(series, point, previousPoint, promptComments),
                    )
                  }
                />
              </Flex>
            </Stack>
          )}

          {/* The studio's comment threads on this commit — what people already
                found out, and where a finding gets recorded, with @mentions
                to pull a colleague in. Comments hang on the commit's gitCommit
                document, so only commits on main (which have one) qualify:
                soak minute charts have no commit, local runs have no sha, and
                PR-branch runs are not synced — a thread on one of those would
                hang on a document that does not exist, with notification links
                into Structure that open nothing. */}
          {series.xKind !== 'minute' &&
            FULL_SHA.test(point.sha) &&
            (branch === 'main' ? (
              <CommitCommentsPanel
                sha={point.sha}
                title={`Commit ${point.sha.slice(0, 7)}`}
                scope={{seriesKey: series.key}}
              />
            ) : (
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  Comments
                </Text>
                <Text size={1} muted>
                  Comments live on main-branch commits; this run measured the {branch} branch.
                </Text>
              </Stack>
            ))}

          {/* Divider before the footer action so it reads as a distinct row */}
          <Box style={{borderTop: '1px solid var(--card-border-color)'}} paddingTop={3}>
            <Flex alignItems="center" justifyContent="space-between" gap={2}>
              <Badge tone="default" fontSize={0}>
                benchRun
              </Badge>
              <Button
                as="a"
                href={documentLink.href}
                onClick={(event) => {
                  documentLink.onClick?.(event)
                  onClose()
                }}
                mode="ghost"
                tone="primary"
                fontSize={1}
                text="Open document"
              />
            </Flex>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  )
}
