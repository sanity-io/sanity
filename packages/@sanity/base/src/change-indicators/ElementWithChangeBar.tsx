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
  hasFocus: boolean
  isChanged: boolean
  disabled?: boolean
}) {
  const {children, hasFocus, isChanged, disabled} = props

  const [hover, setHover] = useState(false)
  const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)

  const handleMouseEnter = useCallback(() => setHover(true), [])
  const handleMouseLeave = useCallback(() => setHover(false), [])

  const changeBar = useMemo(
    () =>
      disabled ? null : (
        <ChangeBar data-testid="change-bar__tooltip-wrapper">
          <ChangeBarMarker />

          <ChangeBarButton
            aria-label="Review changes"
            onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            tabIndex={isReviewChangesOpen || !isChanged ? -1 : 0}
            type="button"
          />
        </ChangeBar>
      ),
    [
      handleMouseEnter,
      handleMouseLeave,
      isReviewChangesOpen,
      onOpenReviewChanges,
      isChanged,
      disabled,
    ]
  )

  return (
    <ChangeBarWrapper
      data-testid="change-bar"
      focus={hasFocus}
      hover={hover}
      changed={isChanged}
      isReviewChangeOpen={isReviewChangesOpen}
      disabled={disabled}
    >
      <FieldWrapper data-testid="change-bar__field-wrapper">{children}</FieldWrapper>
      {changeBar}
    </ChangeBarWrapper>
  )
}
