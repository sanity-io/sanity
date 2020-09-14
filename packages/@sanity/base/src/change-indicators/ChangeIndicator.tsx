import React from 'react'
import {FieldContext} from './FieldContext'
import {Reporter} from './elementTracker'
import isEqual from 'react-fast-compare'
import scrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'
import * as PathUtils from '@sanity/util/paths'

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

interface Props {
  compareDeep: boolean
  children?: React.ReactNode
}

export function ChangeIndicator(props: Props) {
  const context = React.useContext(FieldContext)

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
}
