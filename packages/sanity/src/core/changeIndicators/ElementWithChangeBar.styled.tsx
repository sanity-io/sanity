import {clsx} from 'clsx'
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
  const {changed, className, disabled, hasFocus, isReviewChangeOpen, ...restProps} = props

  return (
    <div
      {...restProps}
      className={clsx(
        changeBarWrapper,
        disabled && changeBarWrapperDisabled,
        hasFocus && changeBarWrapperFocused,
        !changed && changeBarWrapperNotChanged,
        isReviewChangeOpen && changeBarWrapperReviewOpen,
        className,
      )}
    />
  )
}

export function FieldWrapper(props: ComponentProps<'div'>) {
  const {className, ...restProps} = props

  return <div {...restProps} className={clsx(fieldWrapper, className)} />
}

export function ChangeBar(props: ComponentProps<'div'> & {zIndex: number}) {
  const {className, style, zIndex, ...restProps} = props

  return <div {...restProps} className={clsx(changeBar, className)} style={{...style, zIndex}} />
}

export function ChangeBarMarker(props: ComponentProps<'div'>) {
  const {className, ...restProps} = props

  return <div {...restProps} className={clsx(changeBarMarker, className)} />
}

export function ChangeBarButton(
  props: ComponentProps<'button'> & {isInteractive?: boolean; withHoverEffect?: boolean},
) {
  const {className, isInteractive, withHoverEffect, ...restProps} = props

  return (
    <button
      {...restProps}
      className={clsx(
        changeBarButton,
        withHoverEffect && changeBarButtonWithHoverEffect,
        isInteractive && changeBarButtonInteractive,
        className,
      )}
    />
  )
}
