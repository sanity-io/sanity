import {useLayer} from '@sanity/ui'
import React, {useMemo} from 'react'
import {Tooltip} from '../../ui'
import {ConnectorContext} from './ConnectorContext'
import {
  ChangeBar,
  ChangeBarButton,
  ChangeBarMarker,
  ChangeBarWrapper,
  FieldWrapper,
} from './ElementWithChangeBar.styled'

export function ElementWithChangeBar(props: {
  children: React.ReactNode
  disabled?: boolean
  isChanged?: boolean
  withHoverEffect?: boolean
}) {
  const {children, disabled, isChanged, withHoverEffect = true} = props

  const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)
  const {zIndex} = useLayer()

  const changeBar = useMemo(
    () =>
      disabled || !isChanged ? null : (
        <ChangeBar data-testid="change-bar" $zIndex={zIndex}>
          <ChangeBarMarker data-testid="change-bar__marker" />
          <Tooltip content="Review changes" portal>
            <ChangeBarButton
              aria-label="Review changes"
              data-testid="change-bar__button"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              tabIndex={-1}
              type="button"
              $withHoverEffect={withHoverEffect}
            />
          </Tooltip>
        </ChangeBar>
      ),
    [disabled, isChanged, zIndex, isReviewChangesOpen, onOpenReviewChanges, withHoverEffect],
  )

  return (
    <ChangeBarWrapper
      data-testid="change-bar-wrapper"
      $changed={isChanged}
      $disabled={disabled}
      $isReviewChangeOpen={isReviewChangesOpen}
    >
      <FieldWrapper data-testid="change-bar__field-wrapper">{children}</FieldWrapper>
      {changeBar}
    </ChangeBarWrapper>
  )
}
