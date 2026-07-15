import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {
  Badge,
  Box,
  Button,
  Flex,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
  useGlobalKeyDown,
} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {useIntentLink} from 'sanity/router'

import {formatValue, type TrendPoint, type TrendSeries} from './data'
import {backlinksFor, sourceFileUrl} from './links'

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
  referenceElement: HTMLElement | null
  onClose: () => void
}) {
  const {series, point, referenceElement, onClose} = props
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const documentLink = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
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
      content={
        <Box ref={setContentEl} padding={4} style={{width: 288, maxWidth: '92vw'}}>
          <Stack space={4}>
            {/* Header: series title as a quiet eyebrow, close button aligned */}
            <Flex align="flex-start" gap={3}>
              <Box flex={1} paddingTop={1}>
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
            <Stack space={3}>
              <Stack space={2}>
                <Text size={4} weight="semibold">
                  {formatValue(point.value, series.unit)}
                </Text>
                <Text size={1} muted>
                  {when}
                </Text>
              </Stack>
              {(point.p75 !== undefined || point.p90 !== undefined) && (
                <Flex gap={4}>
                  <Stack space={2}>
                    <Text size={0} muted>
                      p75
                    </Text>
                    <Text size={1}>{formatValue(point.p75 ?? point.value, series.unit)}</Text>
                  </Stack>
                  <Stack space={2}>
                    <Text size={0} muted>
                      p90
                    </Text>
                    <Text size={1}>{formatValue(point.p90 ?? point.value, series.unit)}</Text>
                  </Stack>
                </Flex>
              )}
            </Stack>

            {(backlinks.length > 0 || scenarioHref) && (
              <Stack space={2}>
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

            {/* Divider before the footer action so it reads as a distinct row */}
            <Box style={{borderTop: '1px solid var(--card-border-color)'}} paddingTop={3}>
              <Flex align="center" justify="space-between" gap={2}>
                <Badge tone="default" fontSize={0} mode="outline">
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
