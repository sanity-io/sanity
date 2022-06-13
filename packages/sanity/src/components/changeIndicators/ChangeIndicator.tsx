import {useLayer} from '@sanity/ui'
import React, {memo} from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {EMPTY_ARRAY} from '../../form/utils/empty'
import {useReporter} from './tracker'
import {ElementWithChangeBar} from './ElementWithChangeBar'

const ChangeBarWrapper = memo(function ChangeBarWrapper(
  props: Omit<React.ComponentProps<'div'>, 'onChange'> & {
    disabled?: boolean
    path: Path
    hasFocus: boolean
    isChanged?: boolean
    withHoverEffect?: boolean
  }
) {
  const {
    children,
    className,
    disabled,
    hasFocus,
    isChanged,
    path = EMPTY_ARRAY,
    withHoverEffect,
  } = props
  const layer = useLayer()
  const [hasHover, setHover] = React.useState(false)
  const onMouseEnter = React.useCallback(() => setHover(true), [])
  const onMouseLeave = React.useCallback(() => setHover(false), [])
  const ref = React.useRef<HTMLDivElement | null>(null)
  useReporter(
    disabled ? null : `field-${PathUtils.toString(path)}`,
    () => ({
      element: ref.current!,
      path: path,
      isChanged: isChanged,
      hasFocus: hasFocus,
      hasHover: hasHover,
      zIndex: layer.zIndex,
    }),
    deepCompare // note: deepCompare should be ok here since we're not comparing deep values
  )

  return (
    <div ref={ref} className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ElementWithChangeBar
        hasFocus={hasFocus}
        isChanged={isChanged}
        disabled={disabled}
        withHoverEffect={withHoverEffect}
      >
        {children}
      </ElementWithChangeBar>
    </div>
  )
})

export interface ChangeIndicatorProps {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  path: Path
  hasFocus: boolean
  isChanged: boolean
  withHoverEffect?: boolean
}

export function ChangeIndicator(props: ChangeIndicatorProps) {
  const {children, className, disabled, hasFocus, isChanged, path, withHoverEffect} = props
  return (
    <ChangeBarWrapper
      className={className}
      disabled={disabled}
      path={path}
      hasFocus={hasFocus}
      isChanged={isChanged}
      withHoverEffect={withHoverEffect}
    >
      {children}
    </ChangeBarWrapper>
  )
}
