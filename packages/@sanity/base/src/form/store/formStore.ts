import {CurrentUser, ObjectSchemaType} from '@sanity/types'
import createPubSub from 'nano-pubsub'
import {PatchEvent} from '../patch'
import {createFormState, ObjectFormState, SanityDocument} from './formState'

export interface FormStore<T extends SanityDocument> {
  updateValue: (updater: (current: T) => T) => void
  onChange: (patchEvent: PatchEvent) => void
  onSetFieldGroup: (groupName: string) => void
  updateCurrentUser: (updater: (current: CurrentUser) => CurrentUser) => void
  getState: () => ObjectFormState<T>
  getValue: () => T
  subscribe: (subscriber: (value: ObjectFormState<T>) => void) => void
}

export interface ObjectFieldGroupState {
  current?: string
  fields?: {
    [field: string]: ObjectFieldGroupState
  }
}

export function createFormStore<T extends SanityDocument>(
  schemaType: ObjectSchemaType,
  initialValue: T,
  onChange: (event: PatchEvent) => void,
  currentUser: Omit<CurrentUser, 'role'>
): FormStore<T> {
  const pubsub = createPubSub<ObjectFormState<T>>()
  let currentValue: T = initialValue

  let fieldGroupState: ObjectFieldGroupState | undefined

  function onSetFieldGroupState(next: ObjectFieldGroupState) {
    fieldGroupState = next
    updateState()
  }

  let state: ObjectFormState<T> = createFormState(schemaType, {
    onChange,
    onSetFieldGroupState,
    document: initialValue,
    fieldGroupState,
    value: initialValue,
    parent: undefined,
    level: 0,
    currentUser,
  })

  function updateState() {
    state = createFormState(schemaType, {
      document: currentValue,
      parent: undefined,
      fieldGroupState,
      value: currentValue,
      onChange,
      onSetFieldGroupState,
      level: 0,
      currentUser,
    })
    pubsub.publish(state)
  }

  function updateValueWith(updater: (current: T) => T) {
    const nextValue: T = updater(currentValue)
    if (nextValue !== currentValue) {
      currentValue = nextValue
      updateState()
    }
  }

  function onSetFieldGroup(nextGroup: string) {
    onSetFieldGroupState({current: nextGroup, fields: fieldGroupState?.fields})
  }

  return {
    updateValue: updateValueWith,
    onChange,
    getState: () => state,
    updateCurrentUser: (updater) => {
      // todo
    },

    onSetFieldGroup: onSetFieldGroup,
    getValue: () => currentValue,
    subscribe: (subscriber: (value: ObjectFormState<T>) => void) => pubsub.subscribe(subscriber),
  }
}
