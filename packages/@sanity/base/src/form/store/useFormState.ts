import {ObjectSchemaType} from '@sanity/types'
import {useMemo, useState} from 'react'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {ObjectFieldGroupState} from './types'
import {deriveFormState, SanityDocument} from './formState'

export function useFormState(
  schemaType: ObjectSchemaType,
  {value, onChange}: {onChange: (event: PatchEvent) => void; value: Partial<SanityDocument>}
) {
  const currentUser = useCurrentUser()
  const [fieldGroupState, onSetFieldGroupState] = useState<ObjectFieldGroupState>()

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
    })
    // console.timeEnd('derive form state')
    return state
  }, [currentUser, schemaType, fieldGroupState, onChange, value])
}
