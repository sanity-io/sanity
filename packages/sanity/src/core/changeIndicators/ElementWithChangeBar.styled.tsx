import classNames from 'classnames'
import {type ComponentProps} from 'react'

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

export function ChangeBarWrapper(
  props: ComponentProps<'div'> & {
    changed?: boolean
    disabled?: boolean
    hasFocus?: boolean
    isReviewChangeOpen: boolean
  },
) {
  const {changed, disabled, hasFocus, isReviewChangeOpen, ...restProps} = props

  return (
    <div
      {...restProps}
      className={classNames(
        changeBarWrapper,
        disabled && changeBarWrapperDisabled,
        hasFocus && changeBarWrapperFocused,
        !changed && changeBarWrapperNotChanged,
        isReviewChangeOpen && changeBarWrapperReviewOpen,
      )}
    />
  )
}

export function FieldWrapper(props: ComponentProps<'div'>) {
  return <div {...props} className={fieldWrapper} />
}

export function ChangeBar(props: ComponentProps<'div'> & {zIndex: number}) {
  const {zIndex, style, ...restProps} = props

  return <div {...restProps} className={changeBar} style={{...style, zIndex}} />
}

export function ChangeBarMarker(props: ComponentProps<'div'>) {
  return <div {...props} className={changeBarMarker} />
}

export function ChangeBarButton(
  props: ComponentProps<'button'> & {isInteractive?: boolean; withHoverEffect?: boolean},
) {
  const {isInteractive, withHoverEffect, ...restProps} = props

  return (
    <button
      {...restProps}
      className={classNames(
        changeBarButton,
        withHoverEffect && changeBarButtonWithHoverEffect,
        isInteractive && changeBarButtonInteractive,
      )}
    />
  )
}
