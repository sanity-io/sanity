import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RobotIcon} from '@sanity/icons/Robot'
import {Badge, Button, Flex, Stack, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {useEffect, useRef, useState} from 'react'
import {useIntentLink} from 'sanity/router'
import {Box} from 'ui5'

import {formatValue, INP_MIN_INTERACTIONS, type TrendPoint, type TrendSeries} from './data'
import {buildInvestigationPrompt} from './investigationPrompt'
import {backlinksFor, compareUrl, sourceFileUrl} from './links'

const FULL_SHA = /^[0-9a-f]{40}$/i

/**
 * Details for one run, shown in a popover anchored at the clicked point.
 * Summarizes the value, gathers every backlink (PR / commit / CI run) in one
 * place, and offers a jump to the raw benchRun document — more useful than
 * navigating straight to the document, and it works regardless of studio
 * routing quirks. A popover (not a modal dialog) keeps the panel hugging its
 * content and sitting next to the dot it describes.
 */
export function RunDetailPopover(props: {
  series: TrendSeries
  point: TrendPoint
  /** The nearest earlier point on the same line measuring a distinct commit. */
  previousPoint?: TrendPoint
  referenceElement: HTMLElement | null
  onClose: () => void
}) {
  const {series, point, previousPoint, referenceElement, onClose} = props
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  // "What landed between this point and the previous one?" — the GitHub
  // compare view answers it directly. Guarded by the full-sha shape so a
  // 'unknown' or malformed sha never builds a dead link.
  const compareHref =
    previousPoint && FULL_SHA.test(previousPoint.sha) && FULL_SHA.test(point.sha)
      ? compareUrl(previousPoint.sha, point.sha)
      : undefined
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const documentLink = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
  // Feedback for the copy-prompt button lives on the button itself (label +
  // icon flip) rather than a toast — the popover is small enough that the
  // change is right under the cursor, and a failure is just as visible.
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copyResetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(copyResetTimer.current), [])
  const handleCopyPrompt = () => {
    if (!previousPoint) return
    const finish = (state: 'copied' | 'failed') => {
      setCopyState(state)
      clearTimeout(copyResetTimer.current)
      copyResetTimer.current = setTimeout(() => setCopyState('idle'), 2000)
    }
    // navigator.clipboard is undefined outside secure contexts, where the
    // call would throw synchronously instead of rejecting
    try {
      navigator.clipboard.writeText(buildInvestigationPrompt(series, point, previousPoint)).then(
        () => finish('copied'),
        () => finish('failed'),
      )
    } catch {
      finish('failed')
    }
  }
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

  // Popover has no built-in dismissal, so wire up the three affordances a user
  // expects: Escape, the close button (below), and a click outside. The @sanity/ui
  // hooks are the idiomatic path — useClickOutsideEvent already ignores the click
  // that opened the popover, and treats the reference (the clicked dot's anchor)
  // as "inside" so re-clicking a dot doesn't fight the dismissal.
  useGlobalKeyDown((event) => {
    if (event.key === 'Escape') onClose()
  })
  useClickOutsideEvent(onClose, () => [contentEl, referenceElement])

  // Move focus into the popover once it mounts so keyboard users land inside
  // it (not stranded on the chart behind it); focus is restored to the chart
  // by the caller on close. Waits for the content element so the button exists.
  useEffect(() => {
    if (contentEl) closeButtonRef.current?.focus()
  }, [contentEl])

  return (
    <Popover
      open
      portal
      placement="top"
      fallbackPlacements={['bottom', 'right', 'left']}
      referenceElement={referenceElement}
      // A drifted chart tints its card caution/positive, and the popover would
      // otherwise inherit that tone through the theme context — making run
      // details look like a warning about themselves. The run detail is neutral
      // information; the flag belongs to the card, not to this panel.
      tone="default"
      content={
        <Box ref={setContentEl} padding={4} style={{width: 320, maxWidth: '92vw'}}>
          <Stack gap={4}>
            {/* Header: series title as a quiet eyebrow, close button aligned */}
            <Flex align="flex-start" gap={3}>
              <Box flexBasis="0%" flexGrow={1} paddingTop={1}>
                <Text size={1} weight="medium" muted textOverflow="ellipsis">
                  {series.title}
                </Text>
              </Box>
              <Button
                ref={closeButtonRef}
                mode="bleed"
                padding={2}
                fontSize={1}
                icon={CloseIcon}
                aria-label="Close"
                onClick={onClose}
              />
            </Flex>

            {/* The value is the headline; the when-line sits beneath it, and
                the percentiles read as a labelled stat row rather than a run-on */}
            <Stack gap={3}>
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
              {/* An INP from too few interactions is a weak estimate — say so
                  where the number is read, not in a separate chart */}
              {point.interactions !== undefined && point.interactions < INP_MIN_INTERACTIONS && (
                <Badge tone="caution" fontSize={0}>
                  Low confidence: only {point.interactions} interactions (a reliable INP needs{' '}
                  {INP_MIN_INTERACTIONS})
                </Badge>
              )}
            </Stack>

            {(backlinks.length > 0 || scenarioHref) && (
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Links
                </Text>
                <Flex gap={2} wrap="wrap">
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
                      icon={LaunchIcon}
                      text="Scenario"
                    />
                  )}
                </Flex>
              </Stack>
            )}

            {compareHref && (
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Suspect a regression?
                </Text>
                <Button
                  as="a"
                  href={compareHref}
                  target="_blank"
                  rel="noreferrer"
                  mode="ghost"
                  fontSize={1}
                  icon={LaunchIcon}
                  text="Compare with previous run"
                  aria-label="GitHub compare view of the commits between the previous run's commit and this one (opens in a new tab)"
                />
                {/* A paste-ready brief for a coding agent: the full signal
                    (metric, both commits, delta, backlinks) plus the A/B
                    dispatch / bisect recipe from perf/bench/README.md */}
                <Button
                  mode="ghost"
                  fontSize={1}
                  icon={copyState === 'copied' ? CheckmarkIcon : RobotIcon}
                  tone={copyState === 'copied' ? 'positive' : 'default'}
                  text={
                    copyState === 'copied'
                      ? 'Copied'
                      : copyState === 'failed'
                        ? 'Copy failed'
                        : 'Copy investigation prompt'
                  }
                  aria-label="Copy an investigation brief for a coding agent to the clipboard"
                  onClick={handleCopyPrompt}
                />
              </Stack>
            )}

            {/* Divider before the footer action so it reads as a distinct row */}
            <Box style={{borderTop: '1px solid var(--card-border-color)'}} paddingTop={3}>
              <Flex align="center" justify="space-between" gap={2}>
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
      }
    />
  )
}
