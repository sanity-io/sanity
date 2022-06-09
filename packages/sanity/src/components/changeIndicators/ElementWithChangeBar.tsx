import {useLayer} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {ConnectorContext} from './ConnectorContext'
import {
  ChangeBarWrapper,
  FieldWrapper,
  ChangeBar,
  ChangeBarMarker,
  ChangeBarButton,
} from './ElementWithChangeBar.styled'

export function ElementWithChangeBar(props: {
  children: React.ReactNode
  disabled?: boolean
  hasFocus: boolean
  isChanged?: boolean
  withHoverEffect?: boolean
}) {
  const {children, disabled, hasFocus, isChanged, withHoverEffect = true} = props

  const [hover, setHover] = useState(false)
  const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)
  const {zIndex} = useLayer()

  const handleMouseEnter = useCallback(() => setHover(true), [])
  const handleMouseLeave = useCallback(() => setHover(false), [])

  const changeBar = useMemo(
    () =>
      disabled || !isChanged ? null : (
        <ChangeBar data-testid="change-bar" $zIndex={zIndex}>
          <ChangeBarMarker data-testid="change-bar__marker" />

          <ChangeBarButton
            aria-label="Review changes"
            data-testid="change-bar__button"
            onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            tabIndex={-1}
            type="button"
            $withHoverEffect={withHoverEffect}
          />
        </ChangeBar>
      ),
    [
      disabled,
      isChanged,
      zIndex,
      isReviewChangesOpen,
      onOpenReviewChanges,
      handleMouseEnter,
      handleMouseLeave,
      withHoverEffect,
    ]
  )

  return (
    <ChangeBarWrapper
      changed={isChanged}
      data-testid="change-bar-wrapper"
      disabled={disabled}
      focus={hasFocus}
      hover={hover}
      isReviewChangeOpen={isReviewChangesOpen}
    >
      <FieldWrapper data-testid="change-bar__field-wrapper">{children}</FieldWrapper>
      {changeBar}
    </ChangeBarWrapper>
  )
}
