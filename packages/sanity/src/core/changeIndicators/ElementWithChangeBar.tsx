import {useLayer} from '@sanity/ui'
import {type ReactNode, useContext, useMemo} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {
  ChangeBar,
  ChangeBarButton,
  ChangeBarMarker,
  ChangeBarWrapper,
  FieldWrapper,
} from './ElementWithChangeBar.styled'

export function ElementWithChangeBar(props: {
  children: ReactNode
  disabled?: boolean
  hasFocus?: boolean
  isChanged?: boolean
  withHoverEffect?: boolean
  isInteractive?: boolean
}) {
  const {
    children,
    disabled,
    hasFocus,
    isChanged,
    withHoverEffect = true,
    isInteractive = true,
  } = props

  const {onOpenReviewChanges, isReviewChangesOpen} = useContext(ReviewChangesContext)
  const {zIndex} = useLayer()
  const {t} = useTranslation()

  const changeBar = useMemo(() => {
    if (disabled || !isChanged) return null

    return (
      <ChangeBar data-testid="change-bar" zIndex={zIndex}>
        <ChangeBarMarker data-testid="change-bar__marker" />
        {/* Without a way to open review changes, the bar is a marker rather than a control. */}
        {isInteractive && (
          <Tooltip content={t('changes.change-bar.aria-label')} portal>
            <ChangeBarButton
              aria-label={t('changes.change-bar.aria-label')}
              data-testid="change-bar__button"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              tabIndex={-1}
              type="button"
              withHoverEffect={withHoverEffect}
              isInteractive={isInteractive}
            />
          </Tooltip>
        )}
      </ChangeBar>
    )
  }, [
    disabled,
    isChanged,
    isInteractive,
    isReviewChangesOpen,
    onOpenReviewChanges,
    t,
    withHoverEffect,
    zIndex,
  ])

  return (
    <ChangeBarWrapper
      data-testid="change-bar-wrapper"
      changed={isChanged}
      disabled={disabled}
      hasFocus={hasFocus}
      isReviewChangeOpen={isReviewChangesOpen}
    >
      <FieldWrapper data-testid="change-bar__field-wrapper">{children}</FieldWrapper>
      {changeBar}
    </ChangeBarWrapper>
  )
}
