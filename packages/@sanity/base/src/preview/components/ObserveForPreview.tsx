import React from 'react'
import styled from 'styled-components'
import {withPropsStream} from 'react-props-stream'
import shallowEquals from 'shallow-equals'
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  switchMap,
  tap,
} from 'rxjs/operators'
import {concat, of, Observable} from 'rxjs'
import {Text, Flex} from '@sanity/ui'
import {AccessDeniedIcon, WarningOutlineIcon} from '@sanity/icons'
import {observeForPreview} from '../'
import {INVALID_PREVIEW_CONFIG, INSUFFICIENT_PERMISSIONS} from '../constants'
import {FieldName, SortOrdering, Type} from '../types'

// The `<small>` element is used for more compatibility
// with the different downstream preview components
const SmallText = styled.small`
  color: ${({theme}) => theme.sanity.color.muted.default.enabled.fg};
`

function IconWrapper({children}: {children: React.ReactNode}) {
  return (
    <Flex>
      <Text muted size={3}>
        {children}
      </Text>
    </Flex>
  )
}

const INVALID_PREVIEW_FALLBACK = {
  title: <SmallText>Invalid preview config</SmallText>,
  subtitle: <SmallText>Check the error log in the console</SmallText>,
  media: (
    <IconWrapper>
      <WarningOutlineIcon />
    </IconWrapper>
  ),
}

const INSUFFICIENT_PERMISSIONS_FALLBACK = {
  title: <SmallText>Insufficient permissions to access this reference</SmallText>,
  media: (
    <IconWrapper>
      <AccessDeniedIcon />
    </IconWrapper>
  ),
}

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

// Will track a memo of the value as long as the isActive$ stream emits true,
// and emit the memoized value after it switches to to false

// (disclaimer: there's probably a better way to do this)
function memoizeBy<T>(isActive$: Observable<boolean>) {
  return (producer$: Observable<T>) => {
    let memo: T
    return isActive$.pipe(
      distinctUntilChanged(),
      switchMap(
        (isActive): Observable<T> =>
          isActive ? producer$.pipe(tap((v) => (memo = v))) : of(memo).pipe(filter(isNonNullable))
      )
    )
  }
}

type OuterProps = {
  isActive: boolean
  value: any
  type: Type
  children: (props: any) => React.ReactElement
  fields: FieldName[]
  ordering?: SortOrdering
}
const connect = (props$: Observable<OuterProps>): Observable<ReceivedProps> => {
  const sharedProps$ = props$.pipe(publishReplay(1), refCount())

  const isActive$ = sharedProps$.pipe(map((props) => props.isActive !== false))

  return sharedProps$.pipe(
    distinctUntilChanged((props, nextProps) => shallowEquals(props.value, nextProps.value)),
    switchMap(
      (props): Observable<ReceivedProps> =>
        concat(
          of<ReceivedProps>({
            isLoading: true,
            type: props.type,
            children: props.children,
            snapshot: null,
          }),
          observeForPreview(
            props.value,
            props.type,
            props.fields,
            props.ordering ? {ordering: props.ordering} : {}
          ).pipe(
            map(
              (result): ReceivedProps => ({
                isLoading: false,
                type: props.type,
                snapshot: result.snapshot,
                children: props.children,
              })
            )
          )
        )
    ),
    memoizeBy(isActive$)
  )
}

type ReceivedProps<T = unknown> = {
  snapshot: T | typeof INSUFFICIENT_PERMISSIONS | null
  type: Type
  isLoading: boolean
  error?: Error
  children: (props: any) => React.ReactElement
}
export default withPropsStream<OuterProps, ReceivedProps>(connect, function ObserveForPreview(
  props: ReceivedProps
) {
  const {type, error, isLoading, children} = props

  let snapshot: unknown

  if (props.snapshot === INVALID_PREVIEW_CONFIG) {
    snapshot = INVALID_PREVIEW_FALLBACK
  } else if (props.snapshot === INSUFFICIENT_PERMISSIONS) {
    snapshot = INSUFFICIENT_PERMISSIONS_FALLBACK
  } else {
    snapshot = props.snapshot
  }

  return children({
    error,
    isLoading,
    result: {type, snapshot},
  })
})
