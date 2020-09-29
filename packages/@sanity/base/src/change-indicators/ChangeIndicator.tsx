import React from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {useReporter} from './tracker'
import {ChangeIndicatorContext} from './ChangeIndicatorContext'
import {ChangeBar} from './ChangeBar'

const isPrimitive = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  typeof value === 'undefined' ||
  typeof value === 'number'

const canCompareShallow = (valueA: unknown, valueB: unknown): boolean => {
  if (
    typeof valueA === 'undefined' ||
    typeof valueB === 'undefined' ||
    typeof valueA === null ||
    typeof valueB === null
  ) {
    return true
  }

  return isPrimitive(valueA) && isPrimitive(valueB)
}

const ChangeBarWrapper = (
  props: React.ComponentProps<'div'> & {
    isChanged: boolean
    hasFocus: boolean
    fullPath: Path
    children: React.ReactNode
  }
) => {
  const [hasHover, setHover] = React.useState(false)
  const onMouseEnter = React.useCallback(() => setHover(true), [])
  const onMouseLeave = React.useCallback(() => setHover(false), [])
  const ref = React.useRef()

  useReporter(
    `field-${PathUtils.toString(props.fullPath)}`,
    () => ({
      element: ref.current!,
      path: props.fullPath,
      isChanged: props.isChanged,
      hasFocus: props.hasFocus,
      hasHover: hasHover
    }),
    // note: deepCompare should be ok here since we're not comparing deep values
    deepCompare
  )

  return (
    <div ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ChangeBar hasFocus={props.hasFocus} isChanged={props.isChanged}>
        {props.children}
      </ChangeBar>
    </div>
  )
}

export function ChangeIndicatorScope(props: {path: Path; children?: React.ReactNode}) {
  const parentContext = React.useContext(ChangeIndicatorContext)

  return (
    <ChangeIndicatorProvider
      path={props.path}
      focusPath={parentContext.focusPath}
      value={PathUtils.get(parentContext.value, props.path)}
      compareValue={PathUtils.get(parentContext.compareValue, props.path)}
    >
      {props.children}
    </ChangeIndicatorProvider>
  )
}

export function ChangeIndicatorProvider(props: {
  path: Path
  focusPath: Path
  value: any
  compareValue: any
  children: React.ReactNode
}) {
  const parentContext = React.useContext(ChangeIndicatorContext)
  const fullPath = parentContext.fullPath.concat(props.path)

  return (
    <ChangeIndicatorContext.Provider
      value={{
        value: props.value,
        compareValue: props.compareValue,
        focusPath: props.focusPath || [],
        path: props.path,
        fullPath: fullPath
      }}
    >
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
}

interface CoreProps {
  fullPath: Path
  compareDeep: boolean
  value: any
  hasFocus: boolean
  compareValue: any
  children?: React.ReactNode
}

export const CoreChangeIndicator = ({
  fullPath,
  value,
  compareValue,
  hasFocus,
  compareDeep,
  children
}: CoreProps) => {
  // todo: lazy compare debounced (possibly with intersection observer)
  const isChanged =
    (canCompareShallow(value, compareValue) && value !== compareValue) ||
    (compareDeep && !deepCompare(value, compareValue))

  return (
    <ChangeBarWrapper isChanged={isChanged} fullPath={fullPath} hasFocus={hasFocus}>
      {children}
    </ChangeBarWrapper>
  )
}

export const ChangeIndicatorWithProvidedFullPath = ({
  path,
  value,
  hasFocus,
  compareDeep,
  children
}: any) => {
  const parentContext = React.useContext(ChangeIndicatorContext)

  const fullPath = parentContext.fullPath.concat(path)
  return (
    <CoreChangeIndicator
      value={value}
      compareValue={PathUtils.get(parentContext.compareValue, path)}
      hasFocus={hasFocus}
      fullPath={fullPath}
      compareDeep={compareDeep}
    >
      {children}
    </CoreChangeIndicator>
  )
}

interface ContextProvidedProps {
  compareDeep?: boolean
  children?: React.ReactNode
  disabled?: boolean
}

export const ChangeIndicatorCompareValueProvider = (props: {
  value: any
  compareValue: any
  children: React.ReactNode
}) => {
  const parentContext = React.useContext(ChangeIndicatorContext)

  return (
    <ChangeIndicatorContext.Provider
      value={{
        value: props.value,
        compareValue: props.compareValue,
        focusPath: parentContext.focusPath || [],
        path: parentContext.path,
        fullPath: parentContext.fullPath
      }}
    >
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
}

export const ContextProvidedChangeIndicator = (props: ContextProvidedProps) => {
  const context = React.useContext(ChangeIndicatorContext)
  const {value, compareValue, path, focusPath, fullPath} = context
  return props.disabled ? (
    <>{props.children}</>
  ) : (
    <CoreChangeIndicator
      fullPath={fullPath}
      value={value}
      compareValue={compareValue}
      hasFocus={PathUtils.hasFocus(focusPath, path)}
      compareDeep={props.compareDeep}
    >
      {props.children}
    </CoreChangeIndicator>
  )
}

export const ChangeIndicator = ContextProvidedChangeIndicator
