import React from 'react'
import {BaseSchemaType, HiddenPredicateContext, HiddenOptionPredicate} from '@sanity/types'
import {combineLatest, Observable} from 'rxjs'
import {rxComponent} from 'react-rx'
import {distinctUntilChanged, map} from 'rxjs/operators'
import withDocument from '../../utils/withDocument'

export type HiddenOption = BaseSchemaType['hidden']

function checkCondition(
  schemaHiddenOption: HiddenOptionPredicate | undefined | boolean,
  context: HiddenPredicateContext
): boolean {
  return Boolean(
    typeof schemaHiddenOption === 'function' ? schemaHiddenOption(context) : schemaHiddenOption
  )
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
      switchMap((hiddenProp) =>
        !hiddenProp || typeof hiddenProp === 'boolean'
          ? of(hiddenProp)
          : contextArg$.pipe(map((context) => checkCondition(hiddenProp, context)))
      ),
      distinctUntilChanged()
    )

    return combineLatest(childrenProp$, isHidden$).pipe(
      map(([children, isHidden]) => <>{isHidden ? null : children}</>)
    )
  })
)
