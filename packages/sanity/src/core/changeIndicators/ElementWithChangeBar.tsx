import {useLayer, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ReactNode, useContext, useMemo} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {Tooltip} from '../../ui-components'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {
  changeBar as changeBarClass,
  changeBarButton,
  changeBarButtonHoverEffect,
  changeBarButtonInteractive,
  changeBarMarker,
  changeBarMarkerMinWidthVar,
  changeBarWrapper,
  changeBarWrapperDisabled,
  changeBarWrapperFocused,
  changeBarWrapperNotChanged,
  changeBarWrapperReviewOpen,
  changeBarZIndexVar,
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
  const {media} = useThemeV2()
  const {t} = useTranslation()

  const markerMinWidth = media?.[0] ? `${media[0]}px` : '0px'

  const changeBarElement = useMemo(
    () =>
      disabled || !isChanged ? null : (
        <div
          className={changeBarClass}
          data-testid="change-bar"
          style={assignInlineVars({[changeBarZIndexVar]: String(zIndex)})}
        >
          <div
            className={changeBarMarker}
            data-testid="change-bar__marker"
            style={assignInlineVars({[changeBarMarkerMinWidthVar]: markerMinWidth})}
          />
          <Tooltip content={t('changes.change-bar.aria-label')} portal disabled={!isInteractive}>
            <button
              aria-label={t('changes.change-bar.aria-label')}
              data-testid="change-bar__button"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              tabIndex={-1}
              type="button"
              className={[
                changeBarButton,
                withHoverEffect ? changeBarButtonHoverEffect : '',
                isInteractive ? changeBarButtonInteractive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </Tooltip>
        </div>
      ),
    [
      disabled,
      isChanged,
      isInteractive,
      isReviewChangesOpen,
      markerMinWidth,
      onOpenReviewChanges,
      t,
      withHoverEffect,
      zIndex,
    ],
  )

  return (
    <div
      data-testid="change-bar-wrapper"
      className={[
        changeBarWrapper,
        disabled ? changeBarWrapperDisabled : '',
        hasFocus ? changeBarWrapperFocused : '',
        !isChanged ? changeBarWrapperNotChanged : '',
        isReviewChangesOpen ? changeBarWrapperReviewOpen : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={fieldWrapper} data-testid="change-bar__field-wrapper">
        {children}
      </div>
      {changeBarElement}
    </div>
  )
}
