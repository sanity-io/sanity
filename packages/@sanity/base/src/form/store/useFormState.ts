import {ObjectSchemaType} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {merge} from 'lodash'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {ObjectCollapsedState, ObjectFieldGroupState} from './types'
import {prepareFormProps, SanityDocument} from './formState'

export function useFormState(
  schemaType: ObjectSchemaType,
  {value, onChange}: {onChange: (event: PatchEvent) => void; value: Partial<SanityDocument>}
) {
  const currentUser = useCurrentUser()
  const [fieldGroupState, onSetFieldGroupState] = useState<ObjectFieldGroupState>()
  const [collapsedState, onSetCollapsedState] = useState<ObjectCollapsedState>()

  const handleOnCollapseState = useCallback((nextState) => {
    onSetCollapsedState((prevState) => {
      return merge({}, prevState, nextState)
    })
  }, [])

  return useMemo(() => {
    // console.time('derive form state')

    const state = prepareFormProps({
      type: schemaType,
      document: value,
      fieldGroupState,
      onSetFieldGroupState,
      value,
      onChange,
      level: 0,
      currentUser,
      collapsedState,
      onSetCollapsedState: handleOnCollapseState,
    })
    // console.timeEnd('derive form state')
    return state
  }, [
    schemaType,
    value,
    fieldGroupState,
    onChange,
    currentUser,
    collapsedState,
    handleOnCollapseState,
  ])
}
