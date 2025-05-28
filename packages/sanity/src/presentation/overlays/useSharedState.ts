import {type Serializable} from '@sanity/presentation-comlink'
import {useContext, useEffect} from 'react'
import {PresentationSharedStateContext} from 'sanity/_singletons'

/** @public */
export const useSharedState = (key: string, value: Serializable): undefined => {
  const context = useContext(PresentationSharedStateContext)

  if (!context) {
    throw new Error('Preview Snapshots context is missing')
  }

  const {setValue} = context

  useEffect(() => {
    setValue(key, value)
  }, [key, value, setValue])

  return undefined
}
