import {useLayer} from '@sanity/ui'
import React, {useMemo} from 'react'
import {Tooltip} from '../../ui'
import {useTranslation} from '../i18n/hooks/useTranslation'
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
  hasFocus?: boolean
  isChanged?: boolean
  withHoverEffect?: boolean
}) {
  const {children, disabled, hasFocus, isChanged, withHoverEffect = true} = props

  const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)
  const {zIndex} = useLayer()
  const {t} = useTranslation()

  const changeBar = useMemo(
    () =>
      disabled || !isChanged ? null : (
        <ChangeBar data-testid="change-bar" $zIndex={zIndex}>
          <ChangeBarMarker data-testid="change-bar__marker" />
          <Tooltip content={t('changes.change-bar.aria-label')} portal>
            <ChangeBarButton
              aria-label={t('changes.change-bar.aria-label')}
              data-testid="change-bar__button"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              tabIndex={-1}
              type="button"
              $withHoverEffect={withHoverEffect}
            />
          </Tooltip>
        </ChangeBar>
      ),
    [disabled, isChanged, isReviewChangesOpen, onOpenReviewChanges, t, withHoverEffect, zIndex],
  )

  return (
    <ChangeBarWrapper
      data-testid="change-bar-wrapper"
      $changed={isChanged}
      $disabled={disabled}
      $hasFocus={hasFocus}
      $isReviewChangeOpen={isReviewChangesOpen}
    >
      <FieldWrapper data-testid="change-bar__field-wrapper">{children}</FieldWrapper>
      {changeBar}
    </ChangeBarWrapper>
  )
}
