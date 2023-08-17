import {useLayer} from '@sanity/ui'
import React, {
  ComponentProps,
  HTMLProps,
  MouseEvent,
  memo,
  useCallback,
  useRef,
  useState,
} from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {EMPTY_ARRAY} from '../util'
import {useReporter} from './tracker'
import {ElementWithChangeBar} from './ElementWithChangeBar'

const ChangeBarWrapper = memo(function ChangeBarWrapper(
  props: Omit<ComponentProps<'div'>, 'onChange'> & {
    disabled?: boolean
    path: Path
    hasFocus: boolean
    isChanged?: boolean
    withHoverEffect?: boolean
  },
) {
  const {
    children,
    disabled,
    hasFocus,
    isChanged,
    onMouseEnter: onMouseEnterProp,
    onMouseLeave: onMouseLeaveProp,
    path = EMPTY_ARRAY,
    withHoverEffect,
    ...restProps
  } = props
  const layer = useLayer()
  const [hasHover, setHover] = useState(false)
  const onMouseEnter = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onMouseEnterProp?.(event)
      setHover(true)
    },
    [onMouseEnterProp],
  )
  const onMouseLeave = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onMouseLeaveProp?.(event)
      setHover(false)
    },
    [onMouseLeaveProp],
  )
  const ref = useRef<HTMLDivElement | null>(null)
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
    deepCompare, // note: deepCompare should be ok here since we're not comparing deep values
  )

  return (
    <div {...restProps} ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
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

/** @internal */
export interface ChangeIndicatorProps {
  path: Path
  hasFocus: boolean
  isChanged: boolean
  withHoverEffect?: boolean
}

/** @internal */
export function ChangeIndicator(
  props: ChangeIndicatorProps & Omit<HTMLProps<HTMLDivElement>, 'as'>,
) {
  const {children, hasFocus, isChanged, path, withHoverEffect, ...restProps} = props

  return (
    <ChangeBarWrapper
      {...restProps}
      path={path}
      hasFocus={hasFocus}
      isChanged={isChanged}
      withHoverEffect={withHoverEffect}
    >
      {children}
    </ChangeBarWrapper>
  )
}
