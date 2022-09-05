import {useLayer} from '@sanity/ui'
import React, {memo, useCallback, useContext, useEffect, useMemo} from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {useReporter} from './tracker'
import {ChangeIndicatorContext, ChangeIndicatorValueContext} from './ChangeIndicatorContext'
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
    disabled?: boolean
    fullPath: Path
    hasFocus: boolean
    isChanged: boolean
    withHoverEffect?: boolean
  }
) {
  const {children, className, disabled, fullPath, hasFocus, isChanged, withHoverEffect} = props
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

export function ChangeIndicatorScope(props: {path: Path; children?: React.ReactNode}) {
  const {children, path} = props
  const parentContext = React.useContext(ChangeIndicatorContext)
  const parentValueContext = React.useContext(ChangeIndicatorValueContext)
  const focusPath = parentContext.focusPath
  const value = PathUtils.get(parentValueContext, path)
  const compareValue = PathUtils.get(parentContext.compareValue, path)

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
}

export function ChangeIndicatorProvider(props: {
  path: Path
  focusPath: Path
  compareValue: unknown
  value: unknown
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
      compareValue,
      focusPath,
      path,
      fullPath,
    }
  }, [fullPath, compareValue, focusPath, path])

  return (
    <ChangeIndicatorContext.Provider value={contextValue}>
      <ChangeIndicatorValueContext.Provider value={value}>
        {props.children}
      </ChangeIndicatorValueContext.Provider>
    </ChangeIndicatorContext.Provider>
  )
}

export function ChangeIndicatorValueProvider(props: {value: unknown; children: React.ReactNode}) {
  return (
    <ChangeIndicatorValueContext.Provider value={props.value}>
      {props.children}
    </ChangeIndicatorValueContext.Provider>
  )
}

interface CoreProps {
  children?: React.ReactNode
  className?: string
  compareDeep?: boolean
  compareValue: unknown
  disabled?: boolean
  fullPath: Path
  hasFocus: boolean
  /**
   * Callback function that returns a boolean if there are changes
   */
  onHasChanges?: (changed: boolean) => void
  value: unknown
  withHoverEffect?: boolean
}

export function CoreChangeIndicator(props: CoreProps) {
  const {
    children,
    className,
    compareDeep,
    compareValue,
    disabled,
    fullPath,
    hasFocus,
    onHasChanges,
    value,
    withHoverEffect,
  } = props

  // todo: lazy compare debounced (possibly with intersection observer)
  const isChanged =
    (canCompareShallow(value, compareValue) && value !== compareValue) ||
    (compareDeep && !deepCompare(value, compareValue))

  useEffect(() => {
    if (onHasChanges) {
      onHasChanges(isChanged)
    }
  }, [isChanged, onHasChanges])

  return (
    <ChangeBarWrapper
      className={className}
      disabled={disabled}
      fullPath={fullPath}
      hasFocus={hasFocus}
      isChanged={isChanged}
      withHoverEffect={withHoverEffect}
    >
      {children}
    </ChangeBarWrapper>
  )
}

export function ChangeIndicatorForFieldPath(props: {
  path: Path
  isChanged: boolean
  children?: React.ReactNode
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
  return useMemo(
    () => (
      <ChangeBarWrapper
        disabled={disabled}
        className={className}
        isChanged={isChanged}
        hasFocus={Boolean(hasFocus)}
        fullPath={fullPath}
      >
        {children}
      </ChangeBarWrapper>
    ),
    [children, className, disabled, fullPath, hasFocus, isChanged]
  )
}

interface ChangeIndicatorWithProvidedFullPathProps {
  children?: React.ReactNode
  className?: string
  compareDeep?: boolean
  disabled?: boolean
  hasFocus: boolean
  /**
   * Callback function that returns a boolean if there are changes
   */
  onHasChanges?: (changed: boolean) => void
  path: Path
  value: unknown
  withHoverEffect?: boolean
}

export function ChangeIndicatorWithProvidedFullPath(
  props: ChangeIndicatorWithProvidedFullPathProps
) {
  const {
    children,
    className,
    compareDeep,
    disabled,
    hasFocus,
    onHasChanges,
    path,
    value,
    withHoverEffect,
  } = props
  const parentContext = React.useContext(ChangeIndicatorContext)

  const fullPath = React.useMemo(() => PathUtils.pathFor(parentContext.fullPath.concat(path)), [
    parentContext.fullPath,
    path,
  ])

  const handleOnHasChanges = useCallback(
    (changed) => {
      if (onHasChanges) {
        onHasChanges(changed)
      }
    },
    [onHasChanges]
  )

  return (
    <CoreChangeIndicator
      className={className}
      compareDeep={compareDeep}
      compareValue={PathUtils.get(parentContext.compareValue, path)}
      disabled={disabled}
      fullPath={fullPath}
      hasFocus={hasFocus}
      onHasChanges={handleOnHasChanges}
      value={value}
      withHoverEffect={withHoverEffect}
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
      <ChangeIndicatorValueContext.Provider value={value}>
        {children}
      </ChangeIndicatorValueContext.Provider>
    </ChangeIndicatorContext.Provider>
  )
}

export function ContextProvidedChangeIndicator(
  props: ChangeIndicatorContextProvidedProps
): React.ReactElement {
  const {children, className, compareDeep, disabled} = props
  const context = React.useContext(ChangeIndicatorContext)
  const value = React.useContext(ChangeIndicatorValueContext)
  const {compareValue, path, focusPath, fullPath} = context

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
