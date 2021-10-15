import {useLayer} from '@sanity/ui'
import React, {memo, useContext, useMemo} from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {useReporter} from './tracker'
import {ChangeIndicatorContext} from './ChangeIndicatorContext'
import {ElementWithChangeBar} from './ElementWithChangeBar'

const EMPTY_PATH: Path = []

const isPrimitive = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  typeof value === 'undefined' ||
  typeof value === 'number'

const canCompareShallow = (valueA: unknown, valueB: unknown): boolean => {
  if (
    typeof valueA === 'undefined' ||
    typeof valueB === 'undefined' ||
    valueA === null ||
    valueB === null
  ) {
    return true
  }

  return isPrimitive(valueA) && isPrimitive(valueB)
}

const ChangeBarWrapper = memo(function ChangeBarWrapper(
  props: React.ComponentProps<'div'> & {
    isChanged: boolean
    hasFocus: boolean
    fullPath: Path
    disabled?: boolean
  }
) {
  const {children, className, fullPath, hasFocus, isChanged, disabled} = props
  const layer = useLayer()
  const [hasHover, setHover] = React.useState(false)
  const onMouseEnter = React.useCallback(() => setHover(true), [])
  const onMouseLeave = React.useCallback(() => setHover(false), [])
  const ref = React.useRef<HTMLDivElement | null>(null)

  useReporter(
    disabled ? null : `field-${PathUtils.toString(fullPath)}`,
    () => ({
      element: ref.current!,
      path: fullPath,
      isChanged: isChanged,
      hasFocus: hasFocus,
      hasHover: hasHover,
      zIndex: layer.zIndex,
    }),
    // note: deepCompare should be ok here since we're not comparing deep values
    deepCompare
  )

  return (
    <div ref={ref} className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ElementWithChangeBar hasFocus={hasFocus} isChanged={isChanged} disabled={disabled}>
        {children}
      </ElementWithChangeBar>
    </div>
  )
})

export function ChangeIndicatorScope(props: {path: Path; children?: React.ReactNode}) {
  const {children, path} = props
  const parentContext = React.useContext(ChangeIndicatorContext)
  const focusPath = parentContext.focusPath
  const value = PathUtils.get(parentContext.value, path)
  const compareValue = PathUtils.get(parentContext.compareValue, path)

  const node = useMemo(() => {
    return (
      <ChangeIndicatorProvider
        path={path}
        focusPath={focusPath}
        value={value}
        compareValue={compareValue}
      >
        {children}
      </ChangeIndicatorProvider>
    )
  }, [children, compareValue, focusPath, path, value])

  return node
}

export function ChangeIndicatorProvider(props: {
  path: Path
  focusPath: Path
  value: unknown
  compareValue: unknown
  children: React.ReactNode
}) {
  const {compareValue, value} = props
  const parentContext = React.useContext(ChangeIndicatorContext)
  const path = props.path
  const focusPath = useMemo(() => props.focusPath || EMPTY_PATH, [props.focusPath])
  const parentFullPath = parentContext.fullPath
  const fullPath = React.useMemo(() => PathUtils.pathFor(parentFullPath.concat(path)), [
    parentFullPath,
    path,
  ])

  const contextValue = React.useMemo(() => {
    return {
      value,
      compareValue,
      focusPath,
      path,
      fullPath,
    }
  }, [fullPath, value, compareValue, focusPath, path])

  return (
    <ChangeIndicatorContext.Provider value={contextValue}>
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
}

interface CoreProps {
  className?: string
  disabled?: boolean
  fullPath: Path
  compareDeep?: boolean
  value: unknown
  hasFocus: boolean
  compareValue: unknown
  children?: React.ReactNode
}

export function CoreChangeIndicator(props: CoreProps) {
  const {
    className,
    disabled,
    fullPath,
    value,
    compareValue,
    hasFocus,
    compareDeep,
    children,
  } = props
  // todo: lazy compare debounced (possibly with intersection observer)
  const isChanged =
    (canCompareShallow(value, compareValue) && value !== compareValue) ||
    (compareDeep && !deepCompare(value, compareValue))

  return (
    <ChangeBarWrapper
      className={className}
      isChanged={isChanged}
      fullPath={fullPath}
      hasFocus={hasFocus}
      disabled={disabled}
    >
      {children}
    </ChangeBarWrapper>
  )
}

export function ChangeIndicatorForFieldPath(props: {
  path: Path
  isChanged: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  hasFocus?: boolean
}) {
  const {className, disabled, path, hasFocus, isChanged, children} = props
  const parentContext = React.useContext(ChangeIndicatorContext)

  const fullPath = React.useMemo(() => PathUtils.pathFor(parentContext.fullPath.concat(path)), [
    parentContext.fullPath,
    path,
  ])

  return (
    <ChangeBarWrapper
      disabled={disabled}
      className={className}
      isChanged={isChanged}
      hasFocus={Boolean(hasFocus)}
      fullPath={fullPath}
    >
      {children}
    </ChangeBarWrapper>
  )
}

interface ChangeIndicatorWithProvidedFullPathProps {
  className?: string
  disabled?: boolean
  path: Path
  value: unknown
  hasFocus: boolean
  compareDeep?: boolean
  children?: React.ReactNode
}

export function ChangeIndicatorWithProvidedFullPath(
  props: ChangeIndicatorWithProvidedFullPathProps
) {
  const {className, disabled, path, value, hasFocus, compareDeep, children} = props
  const parentContext = React.useContext(ChangeIndicatorContext)

  const fullPath = React.useMemo(() => PathUtils.pathFor(parentContext.fullPath.concat(path)), [
    parentContext.fullPath,
    path,
  ])

  return (
    <CoreChangeIndicator
      disabled={disabled}
      className={className}
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

export interface ChangeIndicatorContextProvidedProps {
  className?: string
  compareDeep?: boolean
  children?: React.ReactNode
  disabled?: boolean
}

export function ChangeIndicatorCompareValueProvider(props: {
  value: unknown
  compareValue: unknown
  children: React.ReactNode
}) {
  const {children, compareValue, value} = props
  const parentContext = useContext(ChangeIndicatorContext)

  const contextValue = useMemo(() => {
    return {
      value,
      compareValue,
      focusPath: parentContext.focusPath || EMPTY_PATH,
      path: parentContext.path,
      fullPath: parentContext.fullPath,
    }
  }, [parentContext.focusPath, parentContext.path, parentContext.fullPath, value, compareValue])

  return (
    <ChangeIndicatorContext.Provider value={contextValue}>
      {children}
    </ChangeIndicatorContext.Provider>
  )
}

export function ContextProvidedChangeIndicator(
  props: ChangeIndicatorContextProvidedProps
): React.ReactElement {
  const {children, className, compareDeep, disabled} = props
  const context = React.useContext(ChangeIndicatorContext)
  const {value, compareValue, path, focusPath, fullPath} = context

  return (
    <CoreChangeIndicator
      disabled={disabled}
      fullPath={fullPath}
      value={value}
      compareValue={compareValue}
      hasFocus={PathUtils.hasFocus(focusPath, path)}
      compareDeep={compareDeep || false}
      className={className}
    >
      {children}
    </CoreChangeIndicator>
  )
}

export const ChangeIndicator = ContextProvidedChangeIndicator
