import {Badge, Card, Stack, Text} from '@sanity/ui'
import {type TFunction, useDateTimeFormat, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type FetchHistoryEntry, type FetchReason} from '../../store/types'

function describeFetchReason(reason: FetchReason, t: TFunction<'vision'>): string {
  switch (reason.type) {
    case 'manual':
      return t('vista.history.reason.manual')
    case 'shortcut':
      return t('vista.history.reason.shortcut')
    case 'options':
      return t('vista.history.reason.options')
    case 'load':
      return t('vista.history.reason.load')
    case 'resume':
      return t('vista.history.reason.resume')
    case 'live':
      return reason.matchedTags.length > 0
        ? t('vista.history.reason.live')
        : t('vista.history.reason.live-restart')
    default: {
      const exhaustive: never = reason
      return String(exhaustive)
    }
  }
}

export function HistoryTab({history}: {history: FetchHistoryEntry[]}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const formatTime = useDateTimeFormat({timeStyle: 'medium'})
  const notApplicable = t('result.timing-not-applicable')

  if (history.length === 0) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          {t('vista.history.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack data-testid="vista-history">
      {history.map((entry) => (
        <Card
          borderBottom
          data-testid="vista-history-entry"
          key={entry.id}
          paddingX={3}
          paddingY={2}
          tone={entry.status === 'error' ? 'critical' : 'default'}
        >
          <Flex alignItems="center" flexWrap="wrap" gap={2}>
            <Text muted size={1}>
              {formatTime.format(new Date(entry.requestedAt))}
            </Text>
            <Text size={1} weight="medium">
              {describeFetchReason(entry.reason, t)}
            </Text>
            {entry.reason.type === 'live' &&
              entry.reason.matchedTags.map((tag) => (
                <Badge fontSize={0} key={tag}>
                  {tag}
                </Badge>
              ))}
            <Box flexBasis="0%" flexGrow={1} />
            {entry.status === 'error' ? (
              <Badge fontSize={0} tone="critical">
                {t('vista.history.failed')}
              </Badge>
            ) : (
              <Text muted size={1}>
                {`${t('result.execution-time-label')} ${entry.ms === undefined ? notApplicable : `${entry.ms}ms`} · ${t('result.end-to-end-time-label')} ${entry.e2eMs === undefined ? notApplicable : `${entry.e2eMs}ms`}`}
              </Text>
            )}
          </Flex>
          {entry.errorMessage && (
            <Box paddingTop={2}>
              <Text muted size={1} textOverflow="ellipsis">
                {entry.errorMessage}
              </Text>
            </Box>
          )}
        </Card>
      ))}
    </Stack>
  )
}
