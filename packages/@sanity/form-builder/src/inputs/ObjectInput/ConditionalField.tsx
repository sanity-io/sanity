import React from 'react'
import {
  BaseSchemaType,
  HiddenOptionCallbackContext,
  HiddenOptionCallback,
  HiddenOptionReactive,
} from '@sanity/types'
import {combineLatest, from, Observable, of} from 'rxjs'
import {rxComponent} from 'react-rx'
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators'
import withDocument from '../../utils/withDocument'

export type HiddenOption = BaseSchemaType['hidden']

function normalizeReturnValue(returnValue: boolean | Promise<boolean> | Observable<boolean>) {
  return !returnValue || typeof returnValue === 'boolean'
    ? of(Boolean(returnValue))
    : from(returnValue)
}

function checkCondition(
  schemaHiddenOption: HiddenOptionCallback | undefined | boolean,
  context: HiddenOptionCallbackContext
) {
  if (!schemaHiddenOption || typeof schemaHiddenOption === 'boolean') {
    return of(schemaHiddenOption)
  }
  return normalizeReturnValue(schemaHiddenOption(context))
}

function isReactiveHiddenOption(
  hiddenOption: HiddenOption | undefined
): hiddenOption is HiddenOptionReactive {
  return hiddenOption !== undefined && typeof hiddenOption !== 'boolean' && 'stream' in hiddenOption
}

interface Props {
  hidden: HiddenOption
  parent: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode
}

export const ConditionalField = (props: Props) => {
  if (!props.hidden || props.hidden === true) {
    return <>{props.hidden === true ? null : props.children}</>
  }
  return <ConditionalFieldWithDocument {...props} />
}

const ConditionalFieldWithDocument = withDocument(
  rxComponent(function ConditionalFieldWithDocument(props$: Observable<Props & {document: any}>) {
    const hiddenProp$ = props$.pipe(
      map((props) => props.hidden),
      distinctUntilChanged()
    )

    const childrenProp$ = props$.pipe(
      map((props) => props.children),
      distinctUntilChanged()
    )

    // A stream of arguments passed to the hidden callback
    const contextArg$ = props$.pipe(map(({document, parent, value}) => ({document, parent, value})))

    const isHidden$ = hiddenProp$.pipe(
      switchMap((hiddenProp) => {
        if (!hiddenProp) {
          return of(false)
        }
        if (isReactiveHiddenOption(hiddenProp)) {
          return hiddenProp.stream(contextArg$)
        }
        return contextArg$.pipe(switchMap((context) => checkCondition(hiddenProp, context)))
      }),
      distinctUntilChanged()
    )

    return combineLatest(childrenProp$, isHidden$).pipe(
      map(([children, shouldHide]) => <>{shouldHide ? null : children}</>)
    )
  })
)
