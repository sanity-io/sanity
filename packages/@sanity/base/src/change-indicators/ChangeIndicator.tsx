import React from 'react'
import {ChangeIndicatorContext} from './ChangeIndicatorContext'
import {Reporter} from './elementTracker'
import isEqual from 'react-fast-compare'
import scrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/util/lib/typedefs/path'
import {trimChildPath} from '@sanity/util/lib/pathUtils'

const isPrimitive = value =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  typeof value === 'undefined' ||
  typeof value === 'number'

// todo: lazy compare debounced (possibly with intersection observer)

const ChangeBar = React.forwardRef(
  (props: {isChanged: boolean; children?: React.ReactNode}, ref: any) => (
    <div
      ref={ref}
      style={{
        paddingRight: 8,
        borderRight: '2px solid #2276fc'
      }}
    >
      {props.children}
    </div>
  )
)

export function ChangeIndicatorScope(props: {path: Path; children: React.ReactNode}) {
  const context = React.useContext(ChangeIndicatorContext)

  return (
    <ChangeIndicatorContext.Provider
      value={{
        value: PathUtils.get(context.value, props.path),
        compareValue: PathUtils.get(context.compareValue, props.path),
        hasFocus: context.hasFocus,
        path: trimChildPath(context.path, props.path)
      }}
    >
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
}

interface Props {
  compareDeep: boolean
  children?: React.ReactNode
}

export const ChangeIndicator = React.memo((props: Props) => {
  const context = React.useContext(ChangeIndicatorContext)

  const ref = React.useRef<HTMLDivElement>(null)
  const scrollTo = React.useCallback(() => {
    scrollIntoViewIfNeeded(ref.current, {
      scrollMode: 'if-needed',
      block: 'center',
      behavior: 'smooth'
    })
  }, [])

  const {value, compareValue} = context

  const isChanged =
    (isPrimitive(value) && isPrimitive(compareValue) && value !== compareValue) ||
    (props.compareDeep && !isEqual(value, compareValue))

  return isChanged ? (
    <Reporter
      id={`field-${PathUtils.toString(context.path)}`}
      component={ChangeBar}
      data={{
        path: context.path,
        isChanged,
        children: props.children,
        scrollTo,
        hasFocus: context.hasFocus
      }}
    />
  ) : (
    props.children || null
  )
})
