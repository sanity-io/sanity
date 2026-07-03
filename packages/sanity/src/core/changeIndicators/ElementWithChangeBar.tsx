import {useLayer} from '@sanity/ui'
import classNames from 'classnames'
import {type ReactNode, useContext, useMemo} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {Tooltip} from '../../ui-components'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {
  changeBar,
  changeBarButton,
  changeBarButtonInteractive,
  changeBarButtonWithHoverEffect,
  changeBarMarker,
  changeBarWrapper,
  changeBarWrapperDisabled,
  changeBarWrapperFocused,
  changeBarWrapperNotChanged,
  changeBarWrapperReviewOpen,
  fieldWrapper,
} from './ElementWithChangeBar.css'

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

  const changeBarElement = useMemo(
    () =>
      disabled || !isChanged ? null : (
        <div className={changeBar} data-testid="change-bar" style={{zIndex}}>
          <div className={changeBarMarker} data-testid="change-bar__marker" />
          <Tooltip content={t('changes.change-bar.aria-label')} portal disabled={!isInteractive}>
            <button
              aria-label={t('changes.change-bar.aria-label')}
              className={classNames(
                changeBarButton,
                withHoverEffect && changeBarButtonWithHoverEffect,
                isInteractive && changeBarButtonInteractive,
              )}
              data-testid="change-bar__button"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              tabIndex={-1}
              type="button"
            />
          </Tooltip>
        </div>
      ),
    [
      disabled,
      isChanged,
      isInteractive,
      isReviewChangesOpen,
      onOpenReviewChanges,
      t,
      withHoverEffect,
      zIndex,
    ],
  )

  return (
    <div
      className={classNames(
        changeBarWrapper,
        disabled && changeBarWrapperDisabled,
        hasFocus && changeBarWrapperFocused,
        !isChanged && changeBarWrapperNotChanged,
        isReviewChangesOpen && changeBarWrapperReviewOpen,
      )}
      data-testid="change-bar-wrapper"
    >
      <div className={fieldWrapper} data-testid="change-bar__field-wrapper">
        {children}
      </div>
      {changeBarElement}
    </div>
  )
}
