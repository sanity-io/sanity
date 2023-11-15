import React, {useMemo} from 'react'
import {Stack, Text} from '@sanity/ui'
import {Button, ButtonProps, TooltipWithNodes} from '../../../../../../ui'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {useTimeAgo} from 'sanity'

interface ReviewChangesButtonProps
  extends Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'width' | 'as' | 'type'> {
  status?: 'changes' | 'saved' | 'syncing'
  lastUpdated?: string
  collapsed?: boolean
}

const ReviewButton = React.forwardRef(function ReviewButton(
  props: ReviewChangesButtonProps,
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

    return {text: ''}
  }, [status, lastUpdatedTime])

  if (!status) {
    return null
  }

  return (
    <TooltipWithNodes
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
        text={collapsed ? undefined : buttonProps?.text}
        tooltipProps={{content: 'Review changes', disabled: collapsed}}
      />
    </TooltipWithNodes>
  )
})

export const ReviewChangesButton = React.memo(ReviewButton)
