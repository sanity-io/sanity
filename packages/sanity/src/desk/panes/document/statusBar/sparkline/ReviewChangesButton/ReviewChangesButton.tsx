import React, {useMemo} from 'react'
import {
  Stack,
  Text,
  Tooltip, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {Button, ButtonProps} from '../../../../../../ui'
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
      portal
      disabled={status !== 'changes'}
      content={
        <Stack space={3}>
          <Text size={1} weight="medium">
            Review changes
          </Text>
          <Text size={1} muted>
            Changes saved <abbr aria-label={a11yUpdatedAgo}>{lastUpdatedTimeAgo}</abbr>
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
        aria-label="Review changes"
        icon={<AnimatedStatusIcon status={status} />}
        text={!collapsed && buttonProps?.text}
      />
    </Tooltip>
  )
})

export const ReviewChangesButton = React.memo(ReviewButton)
