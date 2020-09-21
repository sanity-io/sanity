import React from 'react'
import {ChangeIndicatorContext} from './ChangeIndicatorContext'
import {Reporter} from './elementTracker'
import isEqual from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/util/lib/typedefs/path'

const isPrimitive = value =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  typeof value === 'undefined' ||
  typeof value === 'number'

const CHANGED_STYLE = {
  paddingRight: 8,
  borderRight: '2px solid #2276fc'
}

const ChangeBar = React.forwardRef((props: React.ComponentProps<'div'>, ref: any) => {
  return (
    <div
      ref={ref}
      style={props.isChanged ? CHANGED_STYLE : {}}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {props.children}
    </div>
  )
})

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
        focusPath: parentContext.focusPath ? parentContext.focusPath : props.focusPath,
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
    (isPrimitive(value) && isPrimitive(value) && value !== compareValue) ||
    (compareDeep && !isEqual(value, compareValue))

  return (
    <Reporter
      id={`field-${PathUtils.toString(fullPath)}`}
      component={ChangeBar}
      data={{
        path: fullPath,
        isChanged,
        hasFocus,
        children,
        scrollTo
      }}
    />
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
}

export const ContextProvidedChangeIndicator = (props: ContextProvidedProps) => {
  const context = React.useContext(ChangeIndicatorContext)
  const {value, compareValue, path, focusPath, fullPath} = context

  return (
    <CoreChangeIndicator
      fullPath={fullPath}
      value={value}
      compareValue={compareValue}
      hasFocus={PathUtils.isEqual(fullPath, focusPath)}
      compareDeep={props.compareDeep}
    >
      {props.children}
    </CoreChangeIndicator>
  )
}

export const ChangeIndicator = ContextProvidedChangeIndicator
