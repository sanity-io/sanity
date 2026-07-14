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
import {useState} from 'react'
import {useIntentLink} from 'sanity/router'

import {formatValue, type TrendPoint, type TrendSeries} from './data'
import {backlinksFor} from './links'

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
  const documentLink = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
  const backlinks = backlinksFor(point)
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

  return (
    <Popover
      open
      portal
      placement="top"
      fallbackPlacements={['bottom', 'right', 'left']}
      referenceElement={referenceElement}
      content={
        <Box ref={setContentEl} padding={3} style={{maxWidth: 260}}>
          <Stack space={3}>
            <Stack space={2}>
              <Flex align="flex-start" gap={2}>
                <Box flex={1}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {series.title}
                  </Text>
                </Box>
                <Button
                  mode="bleed"
                  padding={1}
                  fontSize={1}
                  icon={CloseIcon}
                  aria-label="Close"
                  onClick={onClose}
                />
              </Flex>
              <Flex align="center" gap={2}>
                <Text size={3} weight="semibold">
                  {formatValue(point.value, series.unit)}
                </Text>
                <Text size={1} muted>
                  {when}
                </Text>
              </Flex>
              {(point.p75 !== undefined || point.p90 !== undefined) && (
                <Text size={1} muted>
                  p75 {formatValue(point.p75 ?? point.value, series.unit)} · p90{' '}
                  {formatValue(point.p90 ?? point.value, series.unit)}
                </Text>
              )}
            </Stack>

            {backlinks.length > 0 && (
              <Flex gap={2} wrap="wrap">
                {backlinks.map((link) => (
                  <Button
                    key={link.href}
                    as="a"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    mode="ghost"
                    fontSize={1}
                    icon={LaunchIcon}
                    text={link.label}
                  />
                ))}
              </Flex>
            )}

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
                mode="bleed"
                fontSize={1}
                text="Open document"
              />
            </Flex>
          </Stack>
        </Box>
      }
    />
  )
}
