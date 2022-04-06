import {ObjectSchemaType} from '@sanity/types'
import {useMemo, useState} from 'react'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {ObjectCollapsedState, ObjectFieldGroupState} from './types'
import {deriveFormState, SanityDocument} from './formState'

export function useFormState(
  schemaType: ObjectSchemaType,
  {value, onChange}: {onChange: (event: PatchEvent) => void; value: Partial<SanityDocument>}
) {
  const currentUser = useCurrentUser()
  const [fieldGroupState, onSetFieldGroupState] = useState<ObjectFieldGroupState>()
  const [collapsedState, onSetCollapsedState] = useState<ObjectCollapsedState>()

  return useMemo(() => {
    // console.time('derive form state')

    const state = deriveFormState(schemaType, {
      document: value,
      fieldGroupState,
      onSetFieldGroupState,
      value,
      onChange,
      level: 0,
      currentUser,
      collapsedState,
      onSetCollapsedState,
    })
    // console.timeEnd('derive form state')
    return state
  }, [schemaType, value, fieldGroupState, onChange, currentUser, collapsedState])
}
