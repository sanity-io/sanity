import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {useIntentLink} from 'sanity/router'

import {formatValue, type TrendPoint, type TrendSeries} from './data'
import {backlinksFor} from './links'

/**
 * Details for one run, opened by clicking a point. Summarizes the value,
 * gathers every backlink (PR / commit / CI run) in one place, and offers a
 * jump to the raw benchRun document — more useful than navigating straight
 * to the document, and it works regardless of studio routing quirks.
 */
export function RunDetailDialog(props: {
  series: TrendSeries
  point: TrendPoint
  onClose: () => void
}) {
  const {series, point, onClose} = props
  const documentLink = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
  const backlinks = backlinksFor(point)
  const when =
    series.xKind === 'minute'
      ? `minute ${Math.round(point.date.getTime() / 60_000)} of the run`
      : point.date.toISOString().slice(0, 10)

  return (
    <Dialog id="run-detail" header={series.title} onClose={onClose} width={0} zOffset={1000}>
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={3} weight="semibold">
              {formatValue(point.value, series.unit)}
            </Text>
            <Text size={1} muted>
              {when}
            </Text>
          </Stack>

          {(point.p75 !== undefined || point.p90 !== undefined) && (
            <Text size={1} muted>
              p75 {formatValue(point.p75 ?? point.value, series.unit)} · p90{' '}
              {formatValue(point.p90 ?? point.value, series.unit)}
            </Text>
          )}

          {backlinks.length > 0 && (
            <Stack space={2}>
              <Text size={1} weight="medium">
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
                    mode="ghost"
                    fontSize={1}
                    icon={LaunchIcon}
                    text={link.label}
                  />
                ))}
              </Flex>
            </Stack>
          )}

          <Flex justify="flex-end" gap={2}>
            <Badge tone="default" fontSize={0} mode="outline">
              benchRun
            </Badge>
            <Button
              as="a"
              href={documentLink.href}
              onClick={documentLink.onClick}
              mode="bleed"
              fontSize={1}
              text="Open document"
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
