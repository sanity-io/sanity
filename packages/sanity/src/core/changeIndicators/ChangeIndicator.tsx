import {type Path} from '@sanity/types'
import {useLayer} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {
  type ComponentProps,
  type HTMLProps,
  memo,
  type MouseEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import deepCompare from 'react-fast-compare'
import {ConnectorContext} from 'sanity/_singletons'

import {EMPTY_ARRAY} from '../util'
import {ElementWithChangeBar} from './ElementWithChangeBar'
import {useChangeIndicatorsReporter} from './tracker'

const ChangeBarWrapper = memo(function ChangeBarWrapper(
  props: Omit<ComponentProps<'div'>, 'onChange'> & {
    disabled?: boolean
    path: Path
    hasFocus: boolean
    isChanged?: boolean
    withHoverEffect?: boolean
    isInteractive?: boolean
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
    isInteractive,
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

  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const reporterId = useMemo(
    () => (disabled || !element ? null : `field-${PathUtils.toString(path)}`),
    [disabled, element, path],
  )
  const reporterGetSnapshot = useCallback(
    () => ({
      element,
      path: path,
      isChanged: isChanged,
      hasFocus: hasFocus,
      hasHover: hasHover,
      zIndex: layer.zIndex,
    }),
    [element, hasFocus, hasHover, isChanged, layer.zIndex, path],
  )
  useChangeIndicatorsReporter(
    reporterId,
    reporterGetSnapshot,
    deepCompare, // note: deepCompare should be ok here since we're not comparing deep values
  )

  return (
    <div {...restProps} ref={setElement} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ElementWithChangeBar
        hasFocus={hasFocus}
        isChanged={isChanged}
        disabled={disabled}
        withHoverEffect={withHoverEffect}
        isInteractive={isInteractive}
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
  const {isInteractive} = useContext(ConnectorContext)

  return (
    <ChangeBarWrapper
      {...restProps}
      path={path}
      hasFocus={hasFocus}
      isChanged={isChanged}
      withHoverEffect={withHoverEffect}
      isInteractive={isInteractive}
    >
      {children}
    </ChangeBarWrapper>
  )
}
