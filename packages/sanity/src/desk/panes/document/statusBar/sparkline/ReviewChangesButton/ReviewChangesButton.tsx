import React, {useMemo} from 'react'
import {Box, Button, ButtonProps, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {deskLocaleNamespace} from '../../../../../i18n'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {useTimeAgo, useTranslation} from 'sanity'

interface ReviewChangesButtonProps extends React.HTMLProps<HTMLButtonElement> {
  status?: 'changes' | 'saved' | 'syncing'
  lastUpdated?: string
  collapsed?: boolean
}

const ReviewButton = React.forwardRef(function ReviewButton(
  props: ReviewChangesButtonProps & ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {collapsed, status, lastUpdated, ...rest} = props
  const lastUpdatedTime = useTimeAgo(lastUpdated || '', {minimal: true})
  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})
  const a11yUpdatedAgo = useTimeAgo(lastUpdated || '', {minimal: false, agoSuffix: true})

  const {t} = useTranslation(deskLocaleNamespace)

  const buttonProps: ButtonProps = useMemo(() => {
    if (status === 'syncing') {
      return {
        text: t('status-bar.review-changes-button.status.syncing.text'),
        tone: undefined,
      }
    }
    if (status === 'changes') {
      return {
        text: lastUpdatedTime,
        tone: 'caution',
      }
    }
    if (status === 'saved') {
      return {
        text: t('status-bar.review-changes-button.status.saved.text'),
        tone: 'positive',
      }
    }

    return {}
  }, [status, lastUpdatedTime, t])

  if (!status) {
    return null
  }

  return (
    <Tooltip
      placement="top"
      portal
      disabled={status !== 'changes'}
      content={
        <Stack padding={3} space={3}>
          <Text size={1} weight="semibold">
            {t('status-bar.review-changes-button.tooltip.text')}
          </Text>
          <Text size={1} muted>
            {t('status-bar.review-changes-button.tooltip.changes-saved')}{' '}
            <abbr aria-label={a11yUpdatedAgo}>{lastUpdatedTimeAgo}</abbr>
          </Text>
        </Stack>
      }
    >
      <Button
        mode="bleed"
        justify="flex-start"
        tone={buttonProps?.tone}
        {...rest}
        data-testid="review-changes-button"
        ref={ref}
        aria-label={t('status-bar.review-changes-button.aria-label')}
      >
        <Flex align="center">
          <Box marginRight={collapsed ? 0 : 3} aria-hidden="true">
            <Text>
              <AnimatedStatusIcon status={status} />
            </Text>
          </Box>
          {!collapsed && (
            <Text size={1} weight="medium">
              {buttonProps?.text}
            </Text>
          )}
        </Flex>
      </Button>
    </Tooltip>
  )
})

export const ReviewChangesButton = React.memo(ReviewButton)
