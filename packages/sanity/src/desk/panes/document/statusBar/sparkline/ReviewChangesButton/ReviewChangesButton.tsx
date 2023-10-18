import React, {useMemo} from 'react'
import {Box, Button, ButtonProps, Flex, Text} from '@sanity/ui'
import {Tooltip} from '../../../../../../ui'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {useTimeAgo} from 'sanity'

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

  const buttonProps: ButtonProps = useMemo(() => {
    if (status === 'syncing') {
      return {
        text: 'Saving...',
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
        text: 'Saved!',
        tone: 'positive',
      }
    }

    return {}
  }, [status, lastUpdatedTime])

  if (!status) {
    return null
  }

  return (
    <Tooltip
      placement="top"
      disabled={status !== 'changes'}
      text={`Changes saved ${lastUpdatedTimeAgo}`}
    >
      <Button
        mode="bleed"
        justify="flex-start"
        tone={buttonProps?.tone}
        {...rest}
        data-testid="review-changes-button"
        ref={ref}
        aria-label="Review changes"
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
