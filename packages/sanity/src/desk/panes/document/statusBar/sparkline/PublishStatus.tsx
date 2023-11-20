import {Box, Button, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {Translate, useRelativeTime, useTranslation} from 'sanity'

interface PublishStatusProps {
  collapsed?: boolean
  disabled: boolean
  lastPublished?: string
  lastUpdated?: string
  liveEdit: boolean
}

const Root = styled(Flex)`
  cursor: default;
`

export function PublishStatus(props: PublishStatusProps) {
  const {collapsed, disabled, lastPublished, lastUpdated, liveEdit} = props
  const {t} = useTranslation(structureLocaleNamespace)

  // Label with abbreviations and suffix
  const lastPublishedTimeAgo = useRelativeTime(lastPublished || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  // Label with abbreviation and no suffix
  const lastPublishedTime = useRelativeTime(lastPublished || '', {minimal: true})

  // Label with abbreviations and suffix
  const lastUpdatedTimeAgo = useRelativeTime(lastUpdated || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  // Label with abbreviation and no suffix
  const lastUpdatedTime = useRelativeTime(lastUpdated || '', {minimal: true})

  // Accessible labels without abbreviations or suffixes
  const a11yUpdatedAgo = useRelativeTime(lastUpdated || '', {
    minimal: false,
    useTemporalPhrase: true,
  })
  const a11yPublishedAgo = useRelativeTime(lastPublished || '', {
    minimal: false,
    useTemporalPhrase: true,
  })
  const a11yLabel = liveEdit
    ? t('status-bar.publish-status-button.last-updated-time.aria-label', {
        relativeTime: a11yUpdatedAgo,
      })
    : t('status-bar.publish-status-button.last-published-time.aria-label', {
        relativeTime: a11yPublishedAgo,
      })

  return (
    <Root align="center" data-ui="PublishStatus" sizing="border">
      <Tooltip
        placement="top"
        portal
        content={
          <Stack padding={3} space={3}>
            <Text size={1}>
              {liveEdit ? (
                <Translate
                  t={t}
                  i18nKey="status-bar.publish-status-button.last-updated-time.tooltip"
                  components={{
                    RelativeTime: () => (
                      <time
                        dateTime={lastUpdated}
                        aria-label={lastUpdated ? a11yUpdatedAgo : a11yPublishedAgo}
                      >
                        {lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}
                      </time>
                    ),
                  }}
                />
              ) : (
                <Translate
                  t={t}
                  i18nKey="status-bar.publish-status-button.last-published-time.tooltip"
                  components={{
                    RelativeTime: () => (
                      <time dateTime={lastPublished} aria-label={a11yPublishedAgo}>
                        {lastPublishedTimeAgo}
                      </time>
                    ),
                  }}
                />
              )}
            </Text>
          </Stack>
        }
      >
        <Button
          mode="bleed"
          tone={liveEdit ? 'critical' : 'positive'}
          tabIndex={-1}
          disabled={disabled}
          aria-label={a11yLabel}
        >
          <Flex align="center">
            <Box marginRight={collapsed ? 0 : 3}>
              <Text size={2} aria-hidden="true">
                {liveEdit ? <PlayIcon /> : <PublishIcon />}
              </Text>
            </Box>
            {!collapsed && (
              <Text size={1} weight="medium">
                {liveEdit ? (
                  <time dateTime={lastUpdated || lastPublished} aria-label={a11yLabel}>
                    {lastUpdated ? lastUpdatedTime : lastPublishedTime}
                  </time>
                ) : (
                  <time dateTime={lastPublished} aria-label={a11yLabel}>
                    {lastPublishedTime}
                  </time>
                )}
              </Text>
            )}
          </Flex>
        </Button>
      </Tooltip>
    </Root>
  )
}
