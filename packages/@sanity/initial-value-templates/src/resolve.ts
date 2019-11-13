import {Observable, from, of} from 'rxjs'
import {map, takeWhile} from 'rxjs/operators'
import {isPlainObject} from 'lodash'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'

type ProgressEvent = {
  type: Symbol
  message: string
}

type CompleteEvent = {
  type: Symbol
  value: InitialValue
}

type InitialValue = {
  [key: string]: any
}

type ResolveEvent = ProgressEvent | CompleteEvent

export const PROGRESS_EVENT = Symbol.for('RESOLVE_PROGRESS_EVENT')
export const COMPLETE_EVENT = Symbol.for('RESOLVE_COMPLETE_EVENT')

export function isProgressEvent(event: ResolveEvent | InitialValue): event is ProgressEvent {
  return event.type === PROGRESS_EVENT
}

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

export const createProgressEvent = (message: string): ProgressEvent => ({
  type: PROGRESS_EVENT,
  message
})

export const createCompleteEvent = (value: InitialValue): CompleteEvent => ({
  type: COMPLETE_EVENT,
  value
})

export function resolveInitialValue(
  template: Template | TemplateBuilder,
  params: {[key: string]: any} = {}
): Observable<ProgressEvent | InitialValue> {
  // Template builder?
  if (isBuilder(template)) {
    return resolveInitialValue(template.serialize(), params)
  }

  const {id, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  // Static value?
  if (isPlainObject(value)) {
    return of(validateInitialValue(value, template))
  }

  // Not an object, so should be a function
  if (typeof value !== 'function') {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function`
    )
  }

  const initial = value(params)
  const subscribable = isSubscribable(initial) ? from(initial) : of(initial)

  return subscribable.pipe(
    takeWhile(event => isProgressEvent(event), true),
    map(event =>
      isProgressEvent(event) ? event : createCompleteEvent(validateInitialValue(event, template))
    )
  )
}

function isPromise(thing: Promise<any>): thing is Promise<any> {
  return thing ? typeof thing.then === 'function' : false
}

function isObservable(thing: Observable<any>): thing is Observable<any> {
  return thing ? typeof thing.subscribe === 'function' : false
}

function isSubscribable(thing: any) {
  return isPromise(thing as Promise<any>) || isObservable(thing as Observable<any>)
}
