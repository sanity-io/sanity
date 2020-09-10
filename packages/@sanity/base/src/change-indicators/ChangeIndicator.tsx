import React from 'react'
import {FieldContext} from './FieldContext'
import {Reporter} from './elementTracker'
import isEqual from 'react-fast-compare'
import scrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'

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
        paddingRight: 4,
        position: 'relative'
      }}
    >
      {props.children}
      {props.isChanged && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#2276FC'
          }}
        />
      )}
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
  // todo: need to know whether to show in overlay or not
  // return <ChangeBar>{props.children}</ChangeBar>

  return (
    <ChangeBar isChanged={isChanged} ref={ref}>
      {isChanged && context.hasFocus ? (
        <Reporter
          id={`changed-field`}
          component="div"
          data={{path: context.path, children: props.children, scrollTo}}
        />
      ) : (
        props.children || null
      )}
    </ChangeBar>
  )
}
